"""
Turns complete public-domain guitar pieces into alphaTex for the app, keeping every note.

arrange.py builds a melody-plus-bass arrangement from piano or vocal scores. Pieces that were
written for the guitar (Carcassi, Sor, Mertz, Tárrega …) are already playable, so this keeps
all of their notes and only has to decide which string and fret each note goes on. The
fretting-hand fingers are left to the app, which fingers whole songs in chord shapes.

Sources are LilyPond files from the Mutopia Project, only ones whose typesetting is in the
public domain. LilyPond turns them into MIDI (the scripts adds a \\midi block), and the MIDI
gives the pitches and rhythm:

  pip install music21 lilypond
  git clone --depth 1 --filter=blob:none --sparse https://github.com/MutopiaProject/MutopiaProject.git
  (cd MutopiaProject && git sparse-checkout set ftp/CarcassiM ftp/SorF ftp/MertzJK ftp/BachJS ftp/TarregaF)
  MUTOPIA=$PWD/MutopiaProject/ftp python3 scripts/arrange/guitar_pieces.py carcassi3 > /tmp/carcassi3.tex

Each piece's spec (file, tuning, pickup, bars …) is in guitar_pieces.json.
"""
import json, os, re, subprocess, sys, tempfile, itertools
from fractions import Fraction as F
import music21

STANDARD = [64, 59, 55, 50, 45, 40]  # strings 1 (high e) to 6 (low E)
MAXF = 12

DURS = [(F(4), '1', ''), (F(3), '2', ' {d}'), (F(2), '2', ''), (F(3, 2), '4', ' {d}'), (F(1), '4', ''), (F(3, 4), '8', ' {d}'), (F(2, 3), '4', ' {tu 3}'),
        (F(1, 2), '8', ''), (F(3, 8), '16', ' {d}'), (F(1, 3), '8', ' {tu 3}'), (F(1, 4), '16', ''), (F(1, 6), '16', ' {tu 3}'), (F(1, 8), '32', '')]


def split_dur(d):
    parts = []
    while d > 0:
        for (v, t, fx) in DURS:
            if v <= d:
                parts.append((t, fx)); d -= v; break
        else:
            raise ValueError(d)
    return parts


def to_midi(ly_path):
    """Runs LilyPond on a copy of the file with a \\midi block added; returns the MIDI path."""
    import lilypond
    exe = lilypond.executable()
    work = tempfile.mkdtemp()
    name = os.path.splitext(os.path.basename(ly_path))[0]
    src = open(ly_path, encoding='utf-8').read()
    if '\\midi' not in src:
        src = re.sub(r'\\layout\s*\{', r'\\midi { } \\layout {', src)
    path = os.path.join(work, name + '.ly')
    open(path, 'w', encoding='utf-8').write(src)
    subprocess.run([os.path.join(os.path.dirname(exe), 'convert-ly'), '-e', path], cwd=work, capture_output=True)
    subprocess.run([exe, '-s', path], cwd=work, capture_output=True, timeout=300)
    for ext in ('.midi', '.mid'):
        if os.path.exists(os.path.join(work, name + ext)):
            return os.path.join(work, name + ext)
    raise RuntimeError('LilyPond made no MIDI for ' + ly_path)


def q(x):
    """Snap to a 16th-or-triplet grid."""
    return F(round(F(x) * 12), 12)


def read_notes(midi_path, transpose):
    s = music21.converter.parse(midi_path, quantizePost=True, quarterLengthDivisors=(4, 3))
    notes = []
    for n in s.flatten().notes:
        for p in n.pitches:
            notes.append((q(n.offset), p.midi + transpose, max(q(n.quarterLength), F(1, 4))))
    ts = s.recurse().getElementsByClass('TimeSignature').first()
    return sorted(set(notes)), F(ts.barDuration.quarterLength), ts.numerator, ts.denominator


def slices(notes, bar_len, pickup, first_bar, last_bar):
    """Bars of (duration, [(pitch, rings_until)]), one slice per onset; a slice lasts until the next onset."""
    starts = [F(0)] if not pickup else [F(0), F(pickup)]
    end = max(o + d for o, _, d in notes)
    while starts[-1] + bar_len < end: starts.append(starts[-1] + bar_len)
    bars = []
    for bi, b0 in enumerate(starts):
        if bi + 1 < first_bar or (last_bar and bi + 1 > last_bar): continue
        b1 = starts[bi + 1] if bi + 1 < len(starts) else b0 + bar_len
        if bi == len(starts) - 1: b1 = b0 + bar_len
        inbar = [n for n in notes if b0 <= n[0] < b1]
        ons = sorted(set([b0] + [n[0] for n in inbar]))
        evs = []
        for i, o in enumerate(ons):
            d = (ons[i + 1] if i + 1 < len(ons) else b1) - o
            ps = sorted({(p, o + dur) for (oo, p, dur) in inbar if oo == o}, reverse=True)
            evs.append((d, o, ps))
        bars.append((b1 - b0, evs))
    return bars


def candidates(pitches, tuning, max_fret=MAXF):
    """Every way to put these pitches (highest first) on different strings, higher pitch on a thinner string."""
    res = []
    k = len(pitches)
    for strs in itertools.combinations(range(1, len(tuning) + 1), k):
        frets = [p - tuning[s - 1] for p, s in zip(pitches, strs)]
        if all(0 <= f <= max_fret for f in frets):
            res.append(tuple(zip(strs, frets)))
    return res


def reach(lo, hi):
    """Widest comfortable fret span for a hand around fret `lo`."""
    return 5 if lo >= 7 else 4


def solve(bars, tuning, max_fret=MAXF):
    """Dynamic programme over (string choice, hand position) for every slice."""
    flat = [ev for (_, evs) in bars for ev in evs]
    prev = {(None, 0): (0.0, None, ())}  # key -> (cost, back, ringing)
    layers = []
    for (d, onset, ps) in flat:
        pitches = [p for p, _ in ps]
        cands = candidates(pitches, tuning, max_fret) if pitches else [()]
        if not cands:
            raise ValueError(f'no strings for {pitches} at {onset}')
        states = {}
        for ci, c in enumerate(cands):
            fretted = [f for (_, f) in c if f > 0]
            if fretted:
                lo, hi = min(fretted), max(fretted)
                if hi - lo > reach(lo, hi): continue
                hands = range(max(1, hi - 4), lo + 1)
            else:
                hands = [None]
            for H in hands:
                local = 0.0
                for (s, f) in c:
                    if f > 0:
                        local += 0.12 * f  # low on the neck, where an intermediate player is at home
                        if H is not None and f > H + 3: local += 1.2  # little finger stretch
                    else:
                        local -= 0.15  # open strings are easy
                if len(c) >= 2 and c[-1][0] <= 3: local += 2  # bass note on a treble string
                for pk, (pcost, _, ringing) in prev.items():
                    pH = pk[1]
                    t = 0.0
                    if H is not None and pH and pH != H: t += 1.0 + 0.3 * abs(pH - H)
                    # Earlier notes still ringing: don't cut them off by playing their string,
                    # and keep fretted ones under the hand
                    for (rs, rf, until) in ringing:
                        if until <= onset: continue
                        if any(s == rs for s, _ in c): t += 0.4
                        elif H is not None and rf > 0 and not (H <= rf <= H + 4): t += 0.6
                    key = (ci, H if H is not None else pH)
                    tot = pcost + local + t
                    if key not in states or tot < states[key][0]:
                        rings = tuple(r for r in ringing if r[2] > onset and all(s != r[0] for s, _ in c))
                        rings += tuple((s, f, until) for (s, f), (_, until) in zip(c, ps))
                        states[key] = (tot, pk, rings)
        if not states:
            raise ValueError(f'nothing playable at {onset}: {pitches}')
        # keep the search small
        best = sorted(states.items(), key=lambda kv: kv[1][0])[:60]
        states = dict(best)
        layers.append((cands, states))
        prev = states
    k = min(prev, key=lambda x: prev[x][0])
    path = []
    for (cands, states) in reversed(layers):
        path.append(cands[k[0]]); k = states[k][1]
    path.reverse()
    return path


def render(bars, path, num, den):
    out = []
    i = 0
    prev_len = None
    for bi, (ln, evs) in enumerate(bars):
        toks = []
        for (d, _, ps) in evs:
            c = path[i]; i += 1
            parts = split_dur(d)
            if not c:
                toks += [f'r.{t}{fx}' for (t, fx) in parts]
                continue
            # A note held past its slice is let ring, as a guitarist would
            for j, (t, fx) in enumerate(parts):
                ns = [f'{f}.{s}' + ('{t}' if j > 0 else '') for (s, f) in c]
                toks.append((ns[0] if len(ns) == 1 else '(' + ' '.join(ns) + ')') + f'.{t}{fx}')
        sig = ''
        if ln != prev_len:
            n = ln * den / 4
            sig = f'\\ts {int(n) if n == int(n) else num} {den if n == int(n) else den} '
            prev_len = ln
        out.append(sig + ' '.join(toks))
    return ' |\n'.join(out)


def arrange(spec):
    ly = os.path.expandvars(spec['file'])
    midi = to_midi(ly)
    tuning = spec.get('tuning', STANDARD)
    notes, bar_len, num, den = read_notes(midi, spec.get('transpose', 0))
    bars = slices(notes, bar_len, F(spec['pickup']) if spec.get('pickup') else None, spec.get('first_bar', 1), spec.get('last_bar'))
    path = solve(bars, tuning, spec.get('max_fret', MAXF))
    return render(bars, path, num, den)


if __name__ == '__main__':
    specs = json.load(open(os.path.join(os.path.dirname(__file__), 'guitar_pieces.json')))
    print(arrange(specs[sys.argv[1]]))

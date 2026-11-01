"""
Arranges public-domain melodies from the music21 corpus for fingerstyle guitar.

Takes the melody (top voice) and either the score's own bass line or a simple
harmonisation, transposes to a guitar-friendly key, picks strings, frets and
fretting fingers with a small dynamic program, and prints alphaTex.

A spec can also point at a local MusicXML file with "file" (environment variables
are expanded, see "source" in specs.json for where each score comes from), limit
the bars with "measures", and print 10/8-style signatures with "ts_den": 8.

  pip install music21
  python3 scripts/arrange/arrange.py "$(python3 -c 'import json;print(json.dumps(json.load(open("scripts/arrange/specs.json"))["irwin"]))')"
"""
import sys, json, itertools, os
from fractions import Fraction as F
import music21
from music21 import corpus, converter, harmony, note, chord, key as m21key

OPEN = {1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40}
MAXF = 14

def frac(x): return F(x).limit_denominator(48)

def voice_events(part, mrange, pick):
    """Per measure: list of (offset, midi, dur, tie_dest). pick = 'high' | 'low'."""
    out = []
    ms = part.getElementsByClass('Measure')
    seen = 0
    for m in ms:
        if m.number < mrange[0] or m.number > mrange[1]: continue
        seen += 1
        if seen > mrange[1] - mrange[0] + 1: break  # repeated numbers (e.g. a scale chart after the tune)
        evs = []
        for el in m.recurse().notes:
            if isinstance(el, harmony.ChordSymbol): continue
            if el.duration.isGrace or el.duration.quarterLength == 0: continue
            ps = [p.midi for p in (el.pitches if isinstance(el, chord.Chord) else [el.pitch])]
            mid = max(ps) if pick == 'high' else min(ps)
            off = frac(el.getOffsetInHierarchy(m))
            tie = el.tie is not None and el.tie.type in ('stop', 'continue')
            evs.append((off, mid, frac(el.duration.quarterLength), tie))
        # keep one note per onset (highest/lowest)
        byoff = {}
        for e in evs:
            if e[0] not in byoff or (pick == 'high' and e[1] > byoff[e[0]][1]) or (pick == 'low' and e[1] < byoff[e[0]][1]): byoff[e[0]] = e
        out.append((m.number, frac(m.duration.quarterLength), frac(m.barDuration.quarterLength), sorted(byoff.values())))
    return out

def chord_symbols(part, mrange):
    res = {}; seen = 0
    for m in part.getElementsByClass('Measure'):
        if m.number < mrange[0] or m.number > mrange[1]: continue
        seen += 1
        if seen > mrange[1] - mrange[0] + 1: break
        for cs in m.recurse().getElementsByClass(harmony.ChordSymbol):
            if isinstance(cs, harmony.NoChord) or cs.root() is None: continue
            res.setdefault(m.number, []).append((frac(cs.getOffsetInHierarchy(m)), cs.bass().pitchClass, cs.fifth.pitchClass if cs.fifth else None))
    return res

def harmonize(mel, k, seg, spec_chords=None):
    """Choose a diatonic chord per segment; return {measure: [(off, rootpc, fifthpc)]}"""
    sc = k.getScale()
    degs = [1, 4, 5, 6, 2] if k.mode == 'major' else [1, 4, 5, 6, 3, 7]
    chords = []
    for d in degs:
        r = sc.pitchFromDegree(d)
        if k.mode == 'minor' and d == 5:
            pcs = [r.pitchClass, (r.pitchClass + 4) % 12, (r.pitchClass + 7) % 12]
        else:
            pcs = [r.pitchClass, sc.pitchFromDegree((d + 1) % 7 + 1).pitchClass, sc.pitchFromDegree((d + 3) % 7 + 1).pitchClass]
        prior = {1: .4, 4: .15, 5: .25, 6: 0, 2: -.1, 3: -.05, 7: -.05}[d]
        chords.append((d, pcs, prior))
    if spec_chords:
        chords = []
        for i, (root, q) in enumerate(spec_chords):
            pc = music21.pitch.Pitch(root).pitchClass
            chords.append((i + 1 if i == 0 else 10 + i, [pc, (pc + (3 if q == 'm' else 4)) % 12, (pc + 7) % 12], 0.4 if i == 0 else 0.15))
    res = {}; prev = None
    allsegs = []
    for (num, ln, bar, evs) in mel:
        start = ln - bar if ln < bar else F(0)  # pickup measures: offsets start at 0 anyway
        o = F(0)
        while o < ln:
            allsegs.append((num, o, min(o + seg, ln), evs)); o += seg
    for i, (num, a, b, evs) in enumerate(allsegs):
        best = None
        for (d, pcs, prior) in chords:
            s = prior
            for (off, mid, dur, tie) in evs:
                st, en = off, off + dur
                ov = min(en, b) - max(st, a)
                if ov <= 0: continue
                w = float(ov) * (1.6 if st == a else 1.0)
                s += w if mid % 12 in pcs else -0.6 * w
            if prev == d: s += 0.25
            if i == len(allsegs) - 1 and d == 1: s += 3
            if best is None or s > best[0]: best = (s, d, pcs)
        prev = best[1]
        res.setdefault(num, []).append((a, best[2][0], best[2][2]))
    return res

def bass_from_chords(cmap, mel, seg, alt):
    """Bass events from chord map: root at segment start, fifth halfway if alt."""
    out = []
    for (num, ln, bar, evs) in mel:
        lst = []
        segs = cmap.get(num, [])
        for j, (a, r, f5) in enumerate(segs):
            b = segs[j + 1][0] if j + 1 < len(segs) else ln
            if alt and f5 is not None and b - a == 3:
                lst.append((a, r, F(1), False)); lst.append((a + 1, f5, F(2), False))
            elif alt and f5 is not None and b - a >= 2 * (seg / 2) and (b - a) % 2 == 0 and b - a >= 2:
                h = (b - a) / 2
                lst.append((a, r, h, False)); lst.append((a + h, f5, h, False))
            else:
                lst.append((a, r, b - a, False))
        out.append((num, ln, bar, lst))
    return out

DURS = [(F(4), '1', ''), (F(3), '2', ' {d}'), (F(2), '2', ''), (F(3, 2), '4', ' {d}'), (F(1), '4', ''), (F(3, 4), '8', ' {d}'), (F(2, 3), '4', ' {tu 3}'),
        (F(1, 2), '8', ''), (F(3, 8), '16', ' {d}'), (F(1, 3), '8', ' {tu 3}'), (F(1, 4), '16', ''), (F(1, 6), '16', ' {tu 3}'), (F(1, 8), '32', '')]
def split_dur(d):
    parts = []
    while d > 0:
        for (v, t, fx) in DURS:
            if v <= d: parts.append((t, fx)); d -= v; break
        else: raise ValueError(d)
    return parts

def build_events(mel, bass, shift, bass_oct):
    bars = []
    for (num, ln, bar, mevs), (_, _, _, bevs) in zip(mel, bass):
        ons = sorted(set([F(0)] + [e[0] for e in mevs] + [e[0] for e in bevs]))
        ons = [o for o in ons if o < ln]
        md = {e[0]: e for e in mevs}; bd = {e[0]: e for e in bevs}
        evs = []
        for i, o in enumerate(ons):
            d = (ons[i + 1] if i + 1 < len(ons) else ln) - o
            notes = []
            if o in md: notes.append(('m', md[o][1] + shift, md[o][3]))
            if o in bd:
                b = (bd[o][1] if bd[o][1] > 12 else bd[o][1] + 36) + shift  # pitch class -> octave 3, then transpose with the melody
                while b > 52 + bass_oct: b -= 12
                while b < 40: b += 12
                if not notes or notes[0][1] - b >= 3: notes.append(('b', b, bd[o][3]))
            evs.append((d, notes))
        bars.append((ln, evs))
    return bars

def candidates(notes):
    res = []
    if not notes: return [()]
    pitches = [n[1] for n in notes]
    for strs in itertools.permutations(range(1, 7), len(notes)):
        frets = [p - OPEN[s] for p, s in zip(pitches, strs)]
        if any(f < 0 or f > MAXF for f in frets): continue
        # higher pitch on thinner (lower-numbered) string
        ok = all((pitches[i] - pitches[j]) * (strs[j] - strs[i]) > 0 for i in range(len(notes)) for j in range(len(notes)) if i != j and pitches[i] != pitches[j])
        if not ok: continue
        res.append(tuple(zip(strs, frets)))
    return res

def solve(bars):
    flat = [ev for (_, evs) in bars for ev in evs]
    INF = 1e9
    # state: (cand index, H)
    prev = {None: (0.0, None)}  # key -> (cost, backptr)
    layers = []
    prevcands = [()]
    prevstates = {(0, 0): (0.0, None)}
    for idx, (d, notes) in enumerate(flat):
        cands = candidates(notes)
        if not cands: return None
        states = {}
        for ci, c in enumerate(cands):
            fretted = [f for (s, f) in c if f > 0]
            Hs = range(1, 13) if fretted else [0]
            for H in Hs:
                if fretted and (min(fretted) < H or max(fretted) > H + 4): continue
                if H + 4 in fretted and H + 3 in fretted: continue
                if any(fretted.count(x) > 1 and x != H for x in fretted): continue
                local = 0.0
                for (s, f), n in zip(c, notes):
                    if f > 0 and f == H + 4: local += 1.5
                    if n[0] == 'm' and s >= 4: local += 2.5
                    if n[0] == 'm' and s == 3: local += 0.4
                    if n[0] == 'b' and s <= 3: local += 4
                    if n[0] == 'b' and f > 5: local += 0.5
                    if f > 0: local += 0.04 * f
                if fretted: local += 0.06 * H
                for (pk, (pc, _)) in prevstates.items():
                    pci, pH = pk
                    t = 0.0
                    if fretted and pH and pH != H: t = 1.0 + 0.35 * abs(pH - H)
                    # ties: same pitch must stay put
                    for (s, f), n in zip(c, notes):
                        if n[2]:
                            pc_c = prevcands[pci]
                            if (s, f) not in pc_c: t += 50
                    tot = pc + local + t
                    key = (ci, H if fretted else (pH or 0))
                    if key not in states or tot < states[key][0]: states[key] = (tot, pk)
        if not states: return None
        layers.append((cands, states)); prevcands = cands; prevstates = states
    # backtrack
    k = min(prevstates, key=lambda x: prevstates[x][0]); total = prevstates[k][0]
    path = []
    for (cands, states) in reversed(layers):
        path.append((cands[k[0]], k[1])); k = states[k][1]
    path.reverse()
    return total, path

def render(bars, path, rf_bars=4):
    out = []; i = 0; prev_ts = None
    for bi, (ln, evs) in enumerate(bars):
        toks = []
        ts = ln
        for (d, notes) in evs:
            c, H = path[i]; i += 1
            parts = split_dur(d)
            if not notes:
                for (t, fx) in parts: toks.append(f'r.{t}{fx}')
                continue
            def fmt(tie):
                ns = []
                for (s, f), n in zip(c, notes):
                    fx = []
                    if tie or n[2]: fx.append('t')
                    if f > 0 and H and not tie and not n[2]: fx.append(f'lf {min(5, f - H + 2)}')
                    if bi < rf_bars and not tie and not n[2]:
                        fx.append('rf ' + ('1' if n[0] == 'b' or s >= 4 else {1: '4', 2: '3', 3: '2'}[s]))
                    ns.append(f'{f}.{s}' + ('{' + ' '.join(fx) + '}' if fx else ''))
                return ns[0] if len(ns) == 1 else '(' + ' '.join(ns) + ')'
            for j, (t, fx) in enumerate(parts):
                toks.append(f'{fmt(j > 0)}.{t}{fx}')
        out.append((ts, ' '.join(toks)))
    return out

def _abc_path(p):
    if p.startswith('corpus:'):
        import os
        return os.path.join(os.path.dirname(music21.__file__), 'corpus', p[7:])
    return p

def arrange(spec):
    s = corpus.parse(spec['src']) if spec.get('src') else None
    if spec.get('file'):
        s = converter.parse(os.path.expanduser(os.path.expandvars(spec['file'])))
    if spec.get('abc'):
        op = converter.parse(_abc_path(spec['abc']))
        s = op if not hasattr(op, 'scores') else next(sc for sc in op.scores if sc.metadata.title.strip().lower() == spec['title_in_src'].lower())
    parts = s.parts
    mr = spec['measures']
    mel = voice_events(parts[spec.get('mel', 0)], mr, 'high')
    k = s.analyze('key')
    seg = F(spec.get('seg', 2))
    if spec.get('bass') == 'harm':
        bass = bass_from_chords(harmonize(mel, k, seg, spec.get('chordset')), mel, seg, spec.get('alt', True))
        bass = [(n, l, b, [(o, pc, d, t) for (o, pc, d, t) in e]) for (n, l, b, e) in bass]
    elif spec.get('bass') == 'chords':
        cm = chord_symbols(parts[0], mr)
        # carry chord across measures
        full = {}; last = None
        for (num, ln, bar, evs) in mel:
            lst = cm.get(num, [])
            if not lst or lst[0][0] > 0:
                if last: lst = [(F(0), last[1], last[2])] + lst
            if lst: last = lst[-1]
            # restrike root each segment
            segs = []
            o = F(0)
            while o < ln:
                cur = [c for c in lst if c[0] <= o]
                if cur: segs.append((o, cur[-1][1], cur[-1][2]))
                for c in lst:
                    if o < c[0] < o + seg: segs.append(c)
                o += seg
            full[num] = sorted(set(segs))
        bass = bass_from_chords(full, mel, seg, spec.get('alt', True))
    else:
        bass = voice_events(parts[spec['bassPart']], mr, 'low')
        if spec.get('bass_beats'):
            bb = F(spec['bass_beats'])
            bass = [(n, l, b, [e for e in evs if e[0] % bb == 0]) for (n, l, b, evs) in bass]
    best = None
    for shift in ([spec['shift']] if 'shift' in spec else range(-15, 16)):
        mins = min(e[1] for (_, _, _, ev) in mel for e in ev) + shift
        maxs = max(e[1] for (_, _, _, ev) in mel for e in ev) + shift
        if 'shift' not in spec and (maxs > 77 or mins < 50): continue
        tonic = (k.tonic.pitchClass + shift) % 12
        good = {'major': {4: 0.2, 9: 0, 2: 0, 7: 0.2, 0: 0.2}, 'minor': {4: 0, 9: 0, 2: 0.6, 7: 1.5, 11: 1.5}}[k.mode]
        if tonic not in good:
            if 'shift' in spec: good = {tonic: 0}
            else: continue
        bars = build_events(mel, bass, shift, 0)
        r = solve(bars)
        if not r: continue
        cost = r[0] + good[tonic] * 10 + 0.2 * max(0, maxs - 72) * 5
        if best is None or cost < best[0]: best = (cost, shift, bars, r[1])
    cost, shift, bars, path = best
    rend = render(bars, path)
    lines = []; prev = None
    for (ln, toks) in rend:
        pre = ''
        if ln != prev:
            num = ln; den = 4
            while num.denominator != 1 or (den < spec.get('ts_den', 4)): num *= 2; den *= 2
            pre = f'\\\\ts {int(num)} {den} '
            prev = ln
        lines.append(pre + toks)
    tonic = music21.pitch.Pitch(k.tonic.midi + shift).name
    names = ' | '.join(' '.join(music21.pitch.Pitch(e[1] + shift).nameWithOctave for e in ev) for (_, _, _, ev) in mel)
    return {'mel': names, 'shift': shift, 'key': f'{tonic} {k.mode}', 'tex': ' |\n'.join(lines), 'bars': len(lines)}

if __name__ == '__main__':
    spec = json.loads(sys.argv[1])
    r = arrange(spec)
    print(json.dumps(r))

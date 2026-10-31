import * as at from '@coderline/alphatab';
const imp = new at.importer.AlphaTexImporter();
imp.initFromString(process.argv[2], new at.Settings());
try { const s = imp.readScore(); const st=s.tracks[0].staves[0];
for (const mb of s.masterBars) { const f = st.bars[mb.index].voices[0].beats.reduce((a,b)=>a+b.playbackDuration,0); console.log(mb.index+1, mb.timeSignatureNumerator+'/'+mb.timeSignatureDenominator, f, mb.calculateDuration()); } }
catch(e) { console.log(JSON.stringify(e.semanticDiagnostics?.items ?? e.message), JSON.stringify(e.parserDiagnostics?.items)); }

// Compare the two independent derivers (stage D) line by line and item by item.
// Input: stage-d/derivations.json { A: [{area, result}], B: [...] }, stage-b/game.json.
// Output: stage-e/comparison.json and a printed summary.
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(dir, ...p), 'utf8').replace(/^﻿/, ''));

const d = readJson('stage-d', 'derivations.json');
const game = readJson('stage-b', 'game.json').result;
const lineById = new Map(game.lines.map((l) => [l.lineId, l]));

const collect = (runs) => {
  const lines = new Map();
  const forward = new Map();
  const interpretations = [];
  for (const run of runs) {
    const r = run.result || {};
    for (const l of r.lines || []) lines.set(l.lineId, { ...l, area: run.area });
    for (const f of r.forward || []) forward.set(`${f.contract}|${f.itemId}`, { ...f, area: run.area });
    for (const i of r.interpretations || []) interpretations.push({ ...i, area: run.area });
  }
  return { lines, forward, interpretations };
};
const A = collect(d.A);
const B = collect(d.B);

// A verdict includes its reason code for NOT_AUTHORED, since the reason is part of what is decided.
const key = (l) => (l ? l.verdict + (l.verdict === 'NOT_AUTHORED' ? `(${(l.reason || '').split(/[\s,;:(]/)[0]})` : '') : 'MISSING');

const allLineIds = [...new Set([...game.lines.map((l) => l.lineId), ...A.lines.keys(), ...B.lines.keys()])];
const disagreements = [];
let agreeVerdict = 0, agreeFull = 0, both = 0;
const tallyA = {}, tallyB = {};
for (const id of allLineIds) {
  const a = A.lines.get(id), b = B.lines.get(id);
  if (a) tallyA[a.verdict] = (tallyA[a.verdict] || 0) + 1;
  if (b) tallyB[b.verdict] = (tallyB[b.verdict] || 0) + 1;
  if (!a || !b) { disagreements.push({ lineId: id, kind: 'MISSING', A: key(a), B: key(b), line: lineById.get(id) || null }); continue; }
  both++;
  if (a.verdict === b.verdict) agreeVerdict++;
  if (key(a) === key(b)) { agreeFull++; continue; }
  disagreements.push({
    lineId: id, kind: a.verdict === b.verdict ? 'REASON' : 'VERDICT',
    row: (lineById.get(id) || {}).row, value: (lineById.get(id) || {}).value,
    A: { verdict: key(a), support: a.support, collision: a.collision, note: a.note },
    B: { verdict: key(b), support: b.support, collision: b.collision, note: b.note },
  });
}

const fwdIds = [...new Set([...A.forward.keys(), ...B.forward.keys()])];
const fwdDis = [];
let fwdAgree = 0, fwdBoth = 0;
for (const id of fwdIds) {
  const a = A.forward.get(id), b = B.forward.get(id);
  if (!a || !b) { fwdDis.push({ item: id, A: a ? a.result : 'MISSING', B: b ? b.result : 'MISSING' }); continue; }
  fwdBoth++;
  if (a.result === b.result) fwdAgree++;
  else fwdDis.push({ item: id, A: a.result, B: b.result, noteA: a.note, noteB: b.note });
}

const out = {
  lines: { gameLines: game.lines.length, judgedByBoth: both, verdictAgreement: agreeVerdict, fullAgreement: agreeFull, tallyA, tallyB },
  forward: { items: fwdIds.length, judgedByBoth: fwdBoth, agreement: fwdAgree },
  disagreements, forwardDisagreements: fwdDis,
  interpretationsA: A.interpretations, interpretationsB: B.interpretations,
};
fs.mkdirSync(path.join(dir, 'stage-e'), { recursive: true });
fs.writeFileSync(path.join(dir, 'stage-e', 'comparison.json'), JSON.stringify(out, null, 1));

const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) + '%' : 'n/a');
console.log(`Lines: ${game.lines.length} in the game; judged by both ${both}`);
console.log(`  same verdict: ${agreeVerdict} (${pct(agreeVerdict, both)}); same verdict and reason: ${agreeFull} (${pct(agreeFull, both)})`);
console.log('  A tally:', JSON.stringify(tallyA));
console.log('  B tally:', JSON.stringify(tallyB));
console.log(`  disagreements: ${disagreements.length} (verdict ${disagreements.filter((x) => x.kind === 'VERDICT').length}, reason only ${disagreements.filter((x) => x.kind === 'REASON').length}, missing ${disagreements.filter((x) => x.kind === 'MISSING').length})`);
console.log(`Forward results: ${fwdIds.length} items; judged by both ${fwdBoth}; agree ${fwdAgree} (${pct(fwdAgree, fwdBoth)}); disagreements ${fwdDis.length}`);
console.log(`Interpretations recorded: A ${A.interpretations.length}, B ${B.interpretations.length}`);

// Stage C of the conformance check: coverage, row validity and row matching, computed mechanically.
// Input: stage-b/contracts.json, stage-b/game.json. Output: stage-c/*.json and a printed summary.
// Selector satisfaction and value comparison are NOT decided here; that is the derivers' judgement.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
// Files written by PowerShell carry a UTF-8 byte-order mark; strip it before parsing.
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(dir, ...p), 'utf8').replace(/^﻿/, ''));
const register = readJson('register-2026-09-18.json');
const contracts = readJson('stage-b', 'contracts.json');
const game = readJson('stage-b', 'game.json');

const rowIds = register.rows.map((r) => r.id);
const rowSet = new Set(rowIds);
const REQUIREMENTS = new Set(['EQUALS', 'RANGE', 'COUNT', 'EXISTS', 'NOT_EXISTS', 'POSITIONED', 'ORIENTED']);
const DECLS = new Set(['CLAIMED', 'EXCLUDED', 'NON_CLAIMED', 'NOT_AUTHORED']);
const BASES = new Set(['AUTHORED', 'ASSUMED', 'OWNER_RULING', 'ENGINE_ONLY']);

// A row id may be written with a trailing path or selector; take the leading id token.
const rowOf = (s) => String(s || '').trim().split(/[\s\[.(:]/)[0];
const tally = (arr, key) => arr.reduce((m, x) => ((m[x[key]] = (m[x[key]] || 0) + 1), m), {});

const coverage = [];
const candidatesByRow = {};
for (const c of contracts) {
  const name = c.name;
  const items = c.result.items || [];
  const decls = c.result.declarations || [];
  const declared = new Map();
  const unknownDeclRows = [];
  for (const d of decls) {
    const r = rowOf(d.row);
    if (!rowSet.has(r)) { unknownDeclRows.push(d.row); continue; }
    if (!declared.has(r)) declared.set(r, new Set());
    declared.get(r).add(d.declaration);
  }
  const undeclared = rowIds.filter((r) => !declared.has(r) || [...declared.get(r)].every((x) => !DECLS.has(x)));
  const explicitlyUndeclared = rowIds.filter((r) => declared.has(r) && declared.get(r).has('UNDECLARED') && [...declared.get(r)].every((x) => !DECLS.has(x)));
  const unknownItemRows = items.filter((i) => !rowSet.has(rowOf(i.row))).map((i) => `${i.id}:${i.row}`);
  const badRequirements = items.filter((i) => !REQUIREMENTS.has(i.requirement)).map((i) => `${i.id}:${i.requirement}`);
  const badBasis = items.filter((i) => !BASES.has(i.basis)).map((i) => `${i.id}:${i.basis}`);
  const claimedNoItems = [...declared.entries()].filter(([r, s]) => s.has('CLAIMED') && !items.some((i) => rowOf(i.row) === r)).map(([r]) => r);
  const itemsOnUnclaimedRow = items.filter((i) => rowSet.has(rowOf(i.row)) && !(declared.get(rowOf(i.row)) || new Set()).has('CLAIMED') && !(declared.get(rowOf(i.row)) || new Set()).has('EXCLUDED')).map((i) => `${i.id}:${rowOf(i.row)}`);
  coverage.push({
    contract: name, kind: c.kind,
    items: items.length, rowsDeclared: rowIds.length - undeclared.length, rowsTotal: rowIds.length,
    undeclaredRows: undeclared, explicitlyUndeclared: explicitlyUndeclared.length,
    unknownDeclRows, unknownItemRows, badRequirements, badBasis, claimedNoItems, itemsOnUnclaimedRow,
    basisTally: tally(items, 'basis'), requirementTally: tally(items, 'requirement'), checkabilityTally: tally(items, 'checkability'),
    ledgerTally: (c.result.ledger || []).reduce((m, l) => { const k = l.class + (l.class === 'SCHEMA' ? ':' + l.schemaScope : ''); m[k] = (m[k] || 0) + 1; return m; }, {}),
    placementTally: tally(c.result.originalPlacement || [], 'placement'),
  });
  if (c.kind === 'restated') {
    for (const i of items) {
      const r = rowOf(i.row);
      (candidatesByRow[r] = candidatesByRow[r] || []).push({ contract: name, id: i.id, selector: i.selector, requirement: i.requirement, value: i.value, strictness: i.strictness, valueStatus: i.valueStatus, scope: i.scope, basis: i.basis, checkability: i.checkability });
    }
  }
}

const lines = game.result.lines || [];
const unknownGameRows = lines.filter((l) => !rowSet.has(rowOf(l.row))).map((l) => `${l.lineId}:${l.row}`);
const lineCandidates = lines.map((l) => ({
  lineId: l.lineId, elementId: l.elementId, row: rowOf(l.row), value: l.value,
  candidateItems: (candidatesByRow[rowOf(l.row)] || []).map((c) => `${c.contract}|${c.id}`),
}));
const linesPerRow = tally(lines.map((l) => ({ r: rowOf(l.row) })), 'r');

fs.mkdirSync(path.join(dir, 'stage-c'), { recursive: true });
fs.writeFileSync(path.join(dir, 'stage-c', 'coverage.json'), JSON.stringify(coverage, null, 1));
fs.writeFileSync(path.join(dir, 'stage-c', 'candidates.json'), JSON.stringify({ candidatesByRow, lineCandidates, unknownGameRows, linesPerRow }, null, 1));

console.log('Register rows:', rowIds.length);
for (const c of coverage) {
  console.log(`\n== ${c.contract} (${c.kind}) items=${c.items} declared ${c.rowsDeclared}/${c.rowsTotal}`);
  console.log('  undeclared:', c.undeclaredRows.join(',') || '-');
  console.log('  unknown rows (decl/item):', c.unknownDeclRows.length, c.unknownItemRows.length, c.unknownItemRows.slice(0, 5).join(' '));
  console.log('  bad requirement kinds:', c.badRequirements.join(' ') || '-', '| bad basis:', c.badBasis.join(' ') || '-');
  console.log('  CLAIMED with no items:', c.claimedNoItems.join(',') || '-', '| items on rows not CLAIMED/EXCLUDED:', c.itemsOnUnclaimedRow.length);
  console.log('  basis:', JSON.stringify(c.basisTally), 'checkability:', JSON.stringify(c.checkabilityTally));
  console.log('  ledger:', JSON.stringify(c.ledgerTally), 'placement:', JSON.stringify(c.placementTally));
}
console.log(`\nGame: elements=${(game.result.elements || []).length} lines=${lines.length} unknown-row lines=${unknownGameRows.length}`);
console.log('Game ledger:', JSON.stringify((game.result.ledger || []).reduce((m, l) => { const k = l.class + (l.class === 'SCHEMA' ? ':' + l.schemaScope : ''); m[k] = (m[k] || 0) + 1; return m; }, {})));
console.log('Lines with no candidate item on their row:', lineCandidates.filter((l) => l.candidateItems.length === 0).length);

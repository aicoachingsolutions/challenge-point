// Build compact per-area inputs for the two independent derivers (stage D).
// Each input holds the game lines on that area's rows, all game elements, the designation map, and,
// for each restated contract, its items and declarations on those rows plus its relationship rules.
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(dir, ...p), 'utf8').replace(/^﻿/, ''));

const register = readJson('register-2026-09-18.json');
const contracts = readJson('stage-b', 'contracts.json').filter((c) => c.kind === 'restated');
const game = readJson('stage-b', 'game.json').result;
const candidates = readJson('stage-c', 'candidates.json');

const rowOf = (s) => String(s || '').trim().split(/[\s\[.(:]/)[0];
const CHUNKS = {
  1: { name: 'Envelope, Space, Performers, Objects', test: (r) => /^(E|S|P|O)/.test(r) },
  2: { name: 'Objectives, Direction, Transitions', test: (r) => /^(J|DV|T)/.test(r) },
  3: { name: 'Rules of value', test: (r) => /^V/.test(r) },
};

fs.mkdirSync(path.join(dir, 'stage-d'), { recursive: true });
for (const [k, chunk] of Object.entries(CHUNKS)) {
  const rows = register.rows.filter((r) => chunk.test(r.id));
  const rowIds = new Set(rows.map((r) => r.id));
  const lines = game.lines.filter((l) => rowIds.has(rowOf(l.row)));
  const lineCands = candidates.lineCandidates.filter((l) => rowIds.has(l.row));
  const input = {
    chunk: Number(k), area: chunk.name,
    rows: rows.map((r) => r.id),
    gameElements: game.elements,
    designationMap: game.designationMap,
    gameLines: lines,
    lineCandidates: lineCands,
    contracts: contracts.map((c) => ({
      contract: c.name,
      items: (c.result.items || []).filter((i) => rowIds.has(rowOf(i.row))),
      declarations: (c.result.declarations || []).filter((d) => rowIds.has(rowOf(d.row))),
      relationshipRules: c.result.relationshipRules || [],
    })),
  };
  const file = path.join(dir, 'stage-d', `input-area-${k}.json`);
  // One value per line, so a reader's line-based file viewer does not truncate long lines.
  fs.writeFileSync(file, JSON.stringify(input, null, 1));
  const nItems = input.contracts.reduce((s, c) => s + c.items.length, 0);
  console.log(`area ${k} (${chunk.name}): rows=${rows.length} lines=${lines.length} items=${nItems} bytes=${fs.statSync(file).size}`);
}

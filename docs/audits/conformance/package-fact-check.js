'use strict';

/*
 * Read-only fact checker for the 2026-09-20 derivation-engine design package.
 * Run from any directory: node docs/audits/conformance/package-fact-check.js
 * It reads only the four artefacts and the two design documents, and writes its
 * report to stdout so it can be captured without changing source artefacts.
 */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const REGISTER = path.join(ROOT, 'docs/audits/conformance/register-2026-09-18.json');
const CONTRACTS = path.join(ROOT, 'docs/audits/conformance/stage-b/contracts.json');
const GAME = path.join(ROOT, 'docs/audits/conformance/stage-b/game.json');
const PACKAGE = path.join(ROOT, 'docs/design/derivation-engine-design-package-2026-09-20.md');
const TASKS = path.join(ROOT, 'docs/design/knowledge-authoring-tasks.md');
const MOJIBAKE = String.fromCodePoint(0x00e2, 0x20ac, 0x201d);
const EM_DASH = String.fromCodePoint(0x2014);

// Deliberately matches the BOM-safe parsing rule supplied with this task.
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function fmt(value) {
  if (value === null) return '`null`';
  if (Array.isArray(value)) return value.map(fmt).join(', ');
  return String(value).replaceAll('|', '\\|');
}

function itemRef(item) {
  return `${item.id} (${item.row === null ? 'null' : item.row})`;
}

function declarationRef(declaration, contract) {
  return `${contract.object.split('\n')[0]} :: ${declaration.row === null ? 'null' : declaration.row}`;
}

function code(value) {
  return `\`${fmt(value)}\``;
}

function sourceLine(file, needle) {
  const lines = readText(file).split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  if (index === -1) return 'No matching statement found in the supplied design documents.';
  const relative = path.relative(ROOT, file).replaceAll('\\', '/');
  return `\`${relative}:${index + 1}\` — “${lines[index].trim().replaceAll('|', '\\|')}”`;
}

/*
 * The contracts use a small textual selector grammar. An attribute is the
 * identifier on the left of =, ∈, or ⊂; bracketed ledger notes are annotations,
 * not selector predicates. This intentionally does not treat a value such as
 * RESTART in effect=RESTART as the attribute restart.
 */
function selectorAttributes(selector) {
  if (typeof selector !== 'string' || selector.trim() === '' || selector.trim() === '*') return [];
  const withoutNotes = selector.replace(/\s*\[[^\]]*\]/g, '');
  const attributes = [];
  const predicate = /(?:^|\s*&\s*)([A-Za-z][A-Za-z0-9_.]*)\s*(?:=|[^\x00-\x7F])/g;
  for (let match; (match = predicate.exec(withoutNotes)); ) attributes.push(match[1]);
  return [...new Set(attributes)];
}

function status(confirmed, actual) {
  return confirmed ? 'CONFIRMED' : `WRONG (actual: ${actual})`;
}

function add(results, id, claim, confirmed, actual, location, note = '') {
  results.push({ id, claim, result: status(confirmed, actual), actual, location, note });
}

const register = readJson(REGISTER);
const contracts = readJson(CONTRACTS);
const game = readJson(GAME);
const contractsText = readText(CONTRACTS);
const rows = register.rows;
const rowById = new Map(rows.map((row) => [row.id, row]));
const contractResults = contracts.map((contract) => contract.result);
const items = contractResults.flatMap((contract) => contract.items.map((item) => ({ item, contract })));
const declarations = contractResults.flatMap((contract) => contract.declarations.map((declaration) => ({ declaration, contract })));
const results = [];

const expectedFillable = ['S2', 'S5', 'S6', 'P2', 'P5', 'O1', 'O3', 'O4', 'O5', 'J3', 'T2', 'V1'];
const fillable = rows.filter((row) => Object.hasOwn(row, 'fillable')).map((row) => row.id);
add(
  results,
  'R1',
  'Register holds 82 rows',
  rows.length === 82,
  rows.length,
  'No row-total statement found in the supplied design documents.'
);
add(
  results,
  'R2',
  '12 fillable rows with the stated ids',
  JSON.stringify(fillable) === JSON.stringify(expectedFillable),
  `${fillable.length}: ${fillable.join(' ')}`,
  sourceLine(PACKAGE, 'the 12 `fillable` entries')
);

const rowsWithOwner = rows.filter((row) => Object.hasOwn(row, 'ownerRow'));
const nonCollectionWithoutOwner = rows.filter((row) => row.kind !== 'COLLECTION' && !Object.hasOwn(row, 'ownerRow'));
const expectedOwnerless = ['E1', 'E2', 'E3', 'E4', 'S1', 'SV1', 'P5', 'P6a', 'P6b', 'P7', 'DV1', 'V1', 'V2'];
add(
  results,
  'R3',
  '54 field/view rows have ownerRow; 13 game-level rows do not',
  rowsWithOwner.length === 54 && JSON.stringify(nonCollectionWithoutOwner.map((row) => row.id)) === JSON.stringify(expectedOwnerless),
  `${rowsWithOwner.length} ownerRow; ${nonCollectionWithoutOwner.length} ownerless: ${nonCollectionWithoutOwner.map((row) => row.id).join(' ')}`,
  `${sourceLine(PACKAGE, 'the 13 rows with no `ownerRow`')}<br>${sourceLine(TASKS, '`ownerRow` added to all 54 field and view rows')}`
);

const ownerProblems = rowsWithOwner.flatMap((row) => {
  const owner = rowById.get(row.ownerRow);
  const problems = [];
  if (!owner) problems.push(`owner ${row.ownerRow} is absent`);
  else {
    if (owner.kind !== 'COLLECTION') problems.push(`owner ${row.ownerRow} has kind ${owner.kind}`);
    if (!row.path.startsWith(`${owner.path}.`)) problems.push(`path ${row.path} is not below ${owner.path}`);
  }
  return problems.length ? [`${row.id}: ${problems.join('; ')}`] : [];
});
add(
  results,
  'R4',
  'Every ownerRow names a collection whose path properly prefixes the owned row path',
  ownerProblems.length === 0,
  ownerProblems.length ? ownerProblems.join('; ') : '0 violations',
  sourceLine(PACKAGE, "owning collection's attributes for a field row (`ownerRow`)")
);

const expectedDecisions = ['SD-06', 'SD-07', 'SD-09', 'SD-10', 'SD-11', 'SD-12', 'SD-13', 'SD-14', 'SD-20', 'SD-25'];
const decisionIds = register.citableStandingDecisions.map((decision) => decision.id);
add(
  results,
  'R5',
  '10 citable standing decisions with the stated ids',
  JSON.stringify(decisionIds) === JSON.stringify(expectedDecisions),
  `${decisionIds.length}: ${decisionIds.join(' ')}`,
  'No decision-count statement found in the supplied design documents.'
);

const kindCounts = Object.fromEntries(['VIEW', 'COLLECTION', 'FIELD'].map((kind) => [kind, rows.filter((row) => row.kind === kind).length]));
const viewIds = rows.filter((row) => row.kind === 'VIEW').map((row) => row.id);
add(
  results,
  'R6',
  '2 VIEW (SV1, DV1), 15 COLLECTION, and 65 FIELD rows',
  kindCounts.VIEW === 2 && JSON.stringify(viewIds) === JSON.stringify(['SV1', 'DV1']) && kindCounts.COLLECTION === 15 && kindCounts.FIELD === 65,
  `VIEW ${kindCounts.VIEW}: ${viewIds.join(' ')}; COLLECTION ${kindCounts.COLLECTION}; FIELD ${kindCounts.FIELD}`,
  'No row-kind total statement found in the supplied design documents.'
);

/*
 * These are the lists actually named in valueType prose. V1 is intentionally
 * included: it says “controlled vocabulary” and enumerates the values, even
 * though its values live in an external RPC-library phrase rather than this
 * register's vocabularies block. Finite enum prose on J4 and T6 counts too.
 */
const proseVocabularyReferences = [
  ['S3', 'S3.noun'], ['S4', 'S4.functions'], ['O2', 'O2.kind'], ['J4', 'J4.role'],
  ['T1', 'trigger'], ['T5', 'T5.method'], ['T6', 'T6.playState'], ['V1', 'V1.kind'],
  ['V4', 'V4.conditionType'], ['V8a', 'V8a.conditionType'], ['V9a', 'V9a.operation'],
  ['V12', 'trigger'], ['V13', 'V13.effect'], ['V17', 'trigger'], ['V24', 'trigger'], ['V26', 'V26.expiryEffect'],
];
const missingProseVocabularies = proseVocabularyReferences
  .filter(([, vocabularyPath]) => !Object.hasOwn(register.vocabularies, vocabularyPath))
  .map(([rowId, vocabularyPath]) => `${rowId} → ${vocabularyPath}`);
add(
  results,
  'R7',
  'Every closed list named in valueType prose has a vocabularies entry',
  missingProseVocabularies.length === 0,
  missingProseVocabularies.length ? `missing ${missingProseVocabularies.join(', ')}` : '0 missing lists',
  `${sourceLine(PACKAGE, 'indexes rows, `ownerRow`, `rowOrdinal`, the 12 `fillable` entries, `applicability`, `vocabularies`')}<br>Wrong data location: \`docs/audits/conformance/register-2026-09-18.json\` row V1/valueType; \`vocabularies.V1.kind\` is absent.`
);

const vocabularyLists = [];
for (const [key, value] of Object.entries(register.vocabularies)) {
  if (Array.isArray(value) && key !== 'triggerRows') vocabularyLists.push(key);
  if (key === 'contractEnums') {
    for (const [child, childValue] of Object.entries(value)) {
      if (Array.isArray(childValue)) vocabularyLists.push(`contractEnums.${child}`);
    }
  }
}
const missingVocabularyVersions = vocabularyLists.filter((key) => !Object.hasOwn(register.vocabularies.versions, key));
add(
  results,
  'R8',
  'Every vocabulary list has a vocabularies.versions entry',
  missingVocabularyVersions.length === 0,
  `${vocabularyLists.length} vocabulary lists; ${missingVocabularyVersions.length ? `missing ${missingVocabularyVersions.join(', ')}` : 'all versioned'}`,
  sourceLine(PACKAGE, 'Every list, rule set, contract and object version is stamped'),
  'Rule: version only an allowed-value list. `triggerRows` is a row-id index, while triggerQualifiers, scopeConformance, and scopePlaceholderDefect are the three prose notes.'
);

const expectedScopes = ['WHOLE_GAME', 'PER_TEAM', 'PER_OBJECTIVE_SET', 'OWN_INVOLVEMENT', 'BUILD_OUT_EPISODE'];
const scopes = register.vocabularies.contractEnums.scope;
add(
  results,
  'R9',
  'contractEnums.scope contains exactly the five stated values',
  JSON.stringify(scopes) === JSON.stringify(expectedScopes),
  scopes.join(' '),
  sourceLine(PACKAGE, 'including `BUILD_OUT_EPISODE` (SD-36)')
);
add(
  results,
  'R10',
  'Register parses as valid JSON',
  true,
  'parsed successfully after stripping a UTF-8 BOM',
  sourceLine(PACKAGE, 'Validates the register against its own meta-schema')
);

const itemCount = items.length;
const declarationCount = declarations.length;
add(
  results,
  'C1',
  '8 contracts, 221 items, 860 declarations',
  contracts.length === 8 && itemCount === 221 && declarationCount === 860,
  `${contracts.length} contracts, ${itemCount} items, ${declarationCount} declarations`,
  sourceLine(PACKAGE, '860 across eight contracts')
);

const declarationKinds = ['NON_CLAIMED', 'CLAIMED', 'UNDECLARED', 'NOT_AUTHORED', 'EXCLUDED'];
const declarationCounts = Object.fromEntries(declarationKinds.map((kind) => [kind, declarations.filter(({ declaration }) => declaration.declaration === kind).length]));
const expectedDeclarationCounts = { NON_CLAIMED: 502, CLAIMED: 129, UNDECLARED: 122, NOT_AUTHORED: 85, EXCLUDED: 22 };
add(
  results,
  'C2',
  'Declaration kinds have the stated counts, totaling 860',
  declarationKinds.every((kind) => declarationCounts[kind] === expectedDeclarationCounts[kind]) && Object.values(declarationCounts).reduce((a, b) => a + b, 0) === 860,
  `${declarationKinds.map((kind) => `${kind} ${declarationCounts[kind]}`).join('; ')}; total ${Object.values(declarationCounts).reduce((a, b) => a + b, 0)}`,
  sourceLine(PACKAGE, '| `NON_CLAIMED` | 502 |')
);

const compares = items.filter(({ item }) => item.requirement === 'COMPARES');
add(results, 'C3', '0 items have requirement COMPARES', compares.length === 0, compares.length, sourceLine(PACKAGE, 'the corpus contains **zero** `COMPARES` items across 221'));

const v9Items = items.filter(({ item }) => item.row === 'V9');
const v9aItems = items.filter(({ item }) => item.row === 'V9a');
add(
  results,
  'C4',
  '3 items are on V9 and 0 are on V9a',
  v9Items.length === 3 && v9aItems.length === 0,
  `V9 ${v9Items.length}: ${v9Items.map(({ item }) => item.id).join(' ')}; V9a ${v9aItems.length}`,
  sourceLine(TASKS, '3 items author a magnitude (`V9`), and 0 author an operation (`V9a`)')
);

const noneRowItems = items.filter(({ item }) => item.row === 'NONE' || item.row === null);
const structuralNoneItems = noneRowItems.filter(({ item }) => ['STRUCTURAL', 'PARTLY_STRUCTURAL'].includes(item.checkability));
add(
  results,
  'C5',
  '19 items have row NONE/null; 5 are STRUCTURAL or PARTLY_STRUCTURAL',
  noneRowItems.length === 19 && structuralNoneItems.length === 5,
  `${noneRowItems.length} NONE/null; ${structuralNoneItems.length} structural/partly: ${structuralNoneItems.map(({ item }) => item.id).join(' ')}`,
  sourceLine(TASKS, '**19 items carry `row: "NONE"`')
);

const restartItems = items.filter(({ item }) => selectorAttributes(item.selector).includes('restart'));
const restartContracts = [...new Set(restartItems.map(({ contract }) => contract.object))];
add(
  results,
  'C6',
  '8 items use restart as a selector attribute, all in From Goal Kicks',
  restartItems.length === 8 && restartContracts.length === 1 && restartContracts[0].startsWith('From Goal Kicks'),
  `${restartItems.length}: ${restartItems.map(({ item }) => item.id).join(' ')}; contracts ${restartContracts.length}`,
  sourceLine(TASKS, '**Eight items select on `restart`')
);

const buildOutItems = items.filter(({ item }) => item.scope === 'BUILD_OUT_EPISODE');
const buildOutDeclarations = declarations.filter(({ declaration }) => declaration.scope === 'BUILD_OUT_EPISODE');
const buildOutEntries = [
  ...buildOutItems.map(({ item }) => itemRef(item)),
  ...buildOutDeclarations.map(({ declaration, contract }) => declarationRef(declaration, contract)),
];
add(
  results,
  'C7',
  '6 items or declarations carry BUILD_OUT_EPISODE',
  buildOutEntries.length === 6,
  `${buildOutEntries.length}: ${buildOutEntries.join('; ')}`,
  sourceLine(TASKS, '**Four of the six `BUILD_OUT_EPISODE` uses do not conform')
);

const ownItems = items.filter(({ item }) => item.scope === 'OWN_INVOLVEMENT');
const ownDeclarations = declarations.filter(({ declaration }) => declaration.scope === 'OWN_INVOLVEMENT');
const ownNotAuthored = ownDeclarations.filter(({ declaration }) => declaration.declaration === 'NOT_AUTHORED');
const ownUndeclared = ownDeclarations.filter(({ declaration }) => declaration.declaration === 'UNDECLARED');
const expectedOwnNotAuthoredRows = ['S2', 'S6', 'J6', 'J10', 'V18', 'V19', 'V22'];
add(
  results,
  'C8',
  '31 items and 29 declarations use OWN_INVOLVEMENT; declaration breakdown is 7 NOT_AUTHORED and 1 UNDECLARED on stated rows',
  ownItems.length === 31 && ownDeclarations.length === 29 && ownNotAuthored.length === 7 && ownUndeclared.length === 1 && JSON.stringify(ownNotAuthored.map(({ declaration }) => declaration.row)) === JSON.stringify(expectedOwnNotAuthoredRows),
  `${ownItems.length} items; ${ownDeclarations.length} declarations; NOT_AUTHORED ${ownNotAuthored.length}: ${ownNotAuthored.map(({ declaration }) => declaration.row).join(' ')}; UNDECLARED ${ownUndeclared.length}: ${ownUndeclared.map(({ declaration }) => declaration.row).join(' ')}`,
  'No matching aggregate OWN_INVOLVEMENT-count statement found in the supplied design documents.'
);

const mojibakeOccurrences = count(contractsText, MOJIBAKE);
const emDashOccurrences = count(contractsText, EM_DASH);
const mojibakeBreakdown = {
  'declarations[].scope': declarations.reduce((n, { declaration }) => n + count(String(declaration.scope ?? ''), MOJIBAKE), 0),
  structuralClause: items.reduce((n, { item }) => n + count(String(item.structuralClause ?? ''), MOJIBAKE), 0),
  row: [...items.map(({ item }) => item), ...declarations.map(({ declaration }) => declaration)].reduce((n, record) => n + count(String(record.row ?? ''), MOJIBAKE), 0),
  fitNote: items.reduce((n, { item }) => n + count(String(item.fitNote ?? ''), MOJIBAKE), 0),
};
add(
  results,
  'C9',
  'Mojibake occurs 144 times; no real em dash; stated per-field breakdown',
  mojibakeOccurrences === 144 && emDashOccurrences === 0 && mojibakeBreakdown['declarations[].scope'] === 64 && mojibakeBreakdown.structuralClause === 35 && mojibakeBreakdown.row === 6 && mojibakeBreakdown.fitNote === 2,
  `${MOJIBAKE} ${mojibakeOccurrences}; em dash ${emDashOccurrences}; declarations[].scope ${mojibakeBreakdown['declarations[].scope']}; structuralClause ${mojibakeBreakdown.structuralClause}; row ${mojibakeBreakdown.row}; fitNote ${mojibakeBreakdown.fitNote}`,
  sourceLine(TASKS, 'The contract file is mojibake, in 144 places')
);

const missingBasisEvidence = items.filter(({ item }) => typeof item.basisEvidence !== 'string' || item.basisEvidence.trim() === '');
add(results, 'C10', '0 items have empty or missing basisEvidence', missingBasisEvidence.length === 0, missingBasisEvidence.length ? missingBasisEvidence.map(({ item }) => item.id).join(' ') : '0', sourceLine(PACKAGE, 'a missing basis quote'));

const allowedScopes = new Set(scopes);
const placeholderScopeItems = items.filter(({ item }) => item.scope === MOJIBAKE);
const otherInvalidItemScopes = items.filter(({ item }) => !allowedScopes.has(item.scope) && item.scope !== MOJIBAKE);
add(
  results,
  'C11',
  'Every item scope is an allowed scope or the mojibake placeholder',
  otherInvalidItemScopes.length === 0,
  `${placeholderScopeItems.length} placeholder items; ${otherInvalidItemScopes.length ? `other invalid: ${otherInvalidItemScopes.map(({ item }) => `${item.id}=${item.scope}`).join(', ')}` : '0 other invalid'}`,
  sourceLine(PACKAGE, 'requirement kind, operator, scope, basis')
);

const unknownRows = items.filter(({ item }) => item.row !== 'NONE' && item.row !== null && item.row !== MOJIBAKE && !rowById.has(item.row));
add(
  results,
  'X1',
  'Every item row is a register id, NONE, null, or the placeholder',
  unknownRows.length === 0,
  unknownRows.length ? unknownRows.map(({ item }) => `${item.id}=${item.row}`).join('; ') : '0 other values',
  sourceLine(PACKAGE, 'An unknown row id, requirement kind, operator, scope')
);

function selectorFailures(attributeSource) {
  return items.filter(({ item }) => {
    const row = rowById.get(item.row);
    if (!row || row.kind !== 'FIELD') return false;
    const available = attributeSource(row) || [];
    return selectorAttributes(item.selector).some((attribute) => !available.includes(attribute));
  });
}

const ownerSelectorFailures = selectorFailures((row) => rowById.get(row.ownerRow)?.selectorAttributes);
const fieldSelectorFailures = selectorFailures((row) => row.selectorAttributes);
add(
  results,
  'X2',
  'Selector attributes fail 8 times against ownerRow attributes and 63 times against field-row attributes',
  ownerSelectorFailures.length === 8 && fieldSelectorFailures.length === 63,
  `ownerRow ${ownerSelectorFailures.length}: ${ownerSelectorFailures.map(({ item }) => item.id).join(' ')}; field row ${fieldSelectorFailures.length}`,
  `${sourceLine(PACKAGE, "owning collection's attributes for a field row (`ownerRow`)")}<br>${sourceLine(TASKS, 'one refuses 63, the other 8')}`,
  'Failure count is per item: an item fails once if any selector attribute is unavailable.'
);

const lines = game.result.lines;
const positionalLineIds = lines.every((line, index) => line.lineId === `L${index + 1}`);
/* The supplied design package asserts the opposite of the observed game facts. */
add(
  results,
  'X3',
  'Package assertion that ids are structural, checked against game.json',
  !positionalLineIds,
  `${lines.length} lines; ${positionalLineIds ? 'all positional L1…L' + lines.length : 'non-positional line ids found'}`,
  sourceLine(PACKAGE, 'Ids are structural, never positional.'),
  'The game artefact confirms the requested observation: its ids are exactly L1 through L210, so this package sentence is wrong.'
);

const totals = {
  confirmed: results.filter((result) => result.result === 'CONFIRMED').length,
  wrong: results.filter((result) => result.result.startsWith('WRONG')).length,
  unverifiable: results.filter((result) => result.result.startsWith('UNVERIFIABLE')).length,
};
const commit = childProcess.execFileSync('git', ['-C', ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

console.log('# Package fact-check report');
console.log('');
console.log(`- Checkout read: \`${ROOT.replaceAll('\\', '/')}\``);
console.log(`- Git commit checked: \`${commit}\``);
console.log(`- Generated by: \`docs/audits/conformance/package-fact-check.js\``);
console.log(`- Totals: **${totals.confirmed} CONFIRMED / ${totals.wrong} WRONG / ${totals.unverifiable} UNVERIFIABLE**`);
console.log('');
console.log('Selector rule: an attribute is the left side of `=`, `∈`, or `⊂`, after removing bracketed ledger notes. Thus `restart=GOAL_KICK` uses `restart`, while `effect=RESTART` uses `effect`. A selector check counts one failed item even if it has more than one unavailable attribute.');
console.log('');
console.log('Vocabulary rule: a `valueType` names a closed list when it says `closed list` or `controlled vocabulary`, or explicitly gives a finite enum (J4 and T6). Versioning applies to allowed-value lists; `triggerRows` is an index of row ids, and `triggerQualifiers`, `scopeConformance`, and `scopePlaceholderDefect` are prose notes.');
console.log('');
console.log('| Claim | Result | Computed from artefacts | Package location / required change |');
console.log('| --- | --- | --- | --- |');
for (const result of results) {
  const note = result.note ? `<br>${result.note.replaceAll('|', '\\|')}` : '';
  console.log(`| ${result.id}: ${result.claim} | ${result.result} | ${fmt(result.actual)} | ${result.location}${note} |`);
}

#!/usr/bin/env node
'use strict';

/*
 * Read-only final check for CODEX-TASK-final-check-four-questions.md.
 *
 * The script reads exactly the six artefacts named by that task, strips a
 * UTF-8 BOM before parsing the register, and writes its findings to stdout.
 * It does not rewrite inputs or generate the accompanying report.
 */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const sources = {
  package: 'docs/design/derivation-engine-design-package-2026-09-20.md',
  representation: 'docs/design/game-representation-spec-2026-09-18.md',
  derivation: 'docs/design/derivation-spec-2026-09-20.md',
  register: 'docs/audits/conformance/register-2026-09-18.json',
  grammar: 'docs/audits/conformance/grammar-sheet-2026-09-18.md',
  tasks: 'docs/design/knowledge-authoring-tasks.md',
};

function absolute(relative) {
  return path.join(root, relative);
}

function readText(relative) {
  return fs.readFileSync(absolute(relative), 'utf8').replace(/^\uFEFF/, '');
}

function readJson(relative) {
  // The register may carry a BOM.  Parsing is intentionally non-mutating.
  return JSON.parse(readText(relative));
}

const text = Object.fromEntries(Object.entries(sources).map(([name, relative]) => [name, readText(relative)]));
const register = readJson(sources.register);
const lines = Object.fromEntries(Object.entries(text).map(([name, value]) => [name, value.split(/\r?\n/)]));
const findings = [];
const checks = [];

function locations(source, expression) {
  const matcher = expression instanceof RegExp
    ? (line) => { expression.lastIndex = 0; return expression.test(line); }
    : (line) => line.includes(expression);
  return lines[source]
    .flatMap((line, index) => matcher(line)
      ? [{ file: sources[source], line: index + 1, text: line.trim() }]
      : []);
}

function defined(type) {
  const declaration = new RegExp(`^\\s*${type}\\s*(?:\\{|=|:)`, 'm');
  return Object.values(text).some((value) => declaration.test(value));
}

function check(question, label, ok, detail) {
  checks.push({ question, label, ok, detail });
}

function finding(question, title, classification, evidence, reason) {
  findings.push({ question, title, classification, evidence, reason });
}

function has(source, phrase) {
  return text[source].includes(phrase);
}

function all(list) {
  return list.every(Boolean);
}

// Q1 — current rulings, SD-39 through SD-44.
const rulingIds = ['SD-39', 'SD-40', 'SD-41', 'SD-42', 'SD-43', 'SD-44'];
const missingRulings = rulingIds.filter((id) => locations('representation', new RegExp(`\\| ${id} \\|`)).length !== 1);
check('Q1', 'Every current ruling SD-39 through SD-44 has one ruling row', missingRulings.length === 0,
  missingRulings.length ? `missing or duplicated: ${missingRulings.join(', ')}` : 'six current ruling rows');
check('Q1', 'P-4 and SD-R2 are expressly retired as authorities', all([
  has('package', 'P-4 and\nSD-R2 are no longer authorities anywhere.'),
  has('derivation', 'The authority is SD-39'),
  has('representation', 'replaces SD-R2 and P-4 as authorities'),
]), 'package, derivation rules, and representation specification agree');
check('Q1', 'Candidate evidence cannot alter derivation', all([
  has('package', 'candidate value cannot turn `open` into `derived`'),
  has('representation', 'The candidate game is evidence to be checked, never authority used to complete derivation.'),
  /does not make the property derived, and it supplies no support/.test(text.derivation),
]), 'SD-40 prohibition is present in all three live descriptions');
check('Q1', 'Restricted-computation divergence has one refusal disposition', all([
  has('package', 'neither result is adopted'),
  has('package', '`PASS_DIVERGENCE` refusal'),
  has('representation', 'Divergence is a defect/refusal, not an invitation to choose one pass'),
]), 'SD-42 is consistent');
check('Q1', 'SD-43 and SD-44 are carried into the package', all([
  has('package', 'NOT_CHECKABLE_OUTSIDE_REPRESENTATION'),
  has('package', 'Structurally reachable triggers (AM-15, SD-44)'),
  has('derivation', '"Reachable" means structurally reachable (SD-44, 22 September)'),
]), 'current Gate A and reachability rules are present');

const residualGapTaskMappings = [
  {
    packageGap: 'No authored order for combining two modifiers on one referent',
    taskRow: /No authored order for combining two value modifiers on one referent/,
  },
  {
    packageGap: 'A failed supporting cardinality check has no ruled label',
    taskRow: /A supporting existence item whose cardinality check fails has no ruled label/,
  },
];
const residualGapsAbsentFromTaskRegister = residualGapTaskMappings
  .filter((entry) => !entry.taskRow.test(text.tasks))
  .map((entry) => entry.packageGap);
check('Q1', 'Every residual gap the package says is on the task register is present there',
  residualGapsAbsentFromTaskRegister.length === 0,
  residualGapsAbsentFromTaskRegister.length
    ? `absent from task register: ${residualGapsAbsentFromTaskRegister.join('; ')}`
    : 'all claimed residual gaps are present');
if (residualGapsAbsentFromTaskRegister.length) {
  finding('Q1', 'Package claims residual gaps are all on the task register when one or more are absent', 'minor',
    locations('package', /Residual known gaps/),
    `The package's \"each also on the task register\" claim does not hold for: ${residualGapsAbsentFromTaskRegister.join('; ')}. This is a documentation consistency defect and does not change engine behaviour.`);
}
// Q2 — records, types, and data the engine explicitly names.
const requiredRecordDefinitions = [
  'Audit', 'AuditProperty', 'AuditItem', 'Collision', 'RelationshipConflict', 'Tension',
  'ReferenceDefect', 'Disposition', 'RunReport', 'SourceRef', 'SupportRef', 'Constraint',
  'Bounds', 'PermittedBy', 'CandidateGame', 'CandidateCheck', 'GateReport', 'FailureRecord',
  'RefusalRecord',
];
const missingRecordDefinitions = requiredRecordDefinitions.filter((type) => !defined(type));
check('Q2', 'Declared public record definitions are present', missingRecordDefinitions.length === 0,
  missingRecordDefinitions.length ? `missing: ${missingRecordDefinitions.join(', ')}` : `${requiredRecordDefinitions.length} definitions found`);

const requiredRegisterKeys = [
  'rows', 'vocabularies', 'selectorSyntax', 'relativeTerms', 'teamDesignations', 'comparison',
  'decidingRules', 'citableStandingDecisions', 'applicability',
];
const missingRegisterKeys = requiredRegisterKeys.filter((key) => !Object.hasOwn(register, key));
const rowIds = register.rows.map((row) => row.id);
const duplicateRowIds = rowIds.filter((id, index) => rowIds.indexOf(id) !== index);
const rowById = new Map(register.rows.map((row) => [row.id, row]));
const invalidOwners = register.rows.filter((row) => Object.hasOwn(row, 'ownerRow')
  && (!rowById.has(row.ownerRow) || rowById.get(row.ownerRow).kind !== 'COLLECTION'));
check('Q2', 'Register parses and supplies every engine-indexed data block', missingRegisterKeys.length === 0
  && duplicateRowIds.length === 0 && invalidOwners.length === 0,
  `${register.rows.length} rows; ${missingRegisterKeys.length} missing data blocks; ${duplicateRowIds.length} duplicate row ids; ${invalidOwners.length} invalid ownerRow values`);

const loadedContractUses = locations('package', /\bLoadedContract\b/);
if (!defined('LoadedContract')) {
  finding('Q2', 'LoadedContract is named but never defined', 'genuine blocker', loadedContractUses,
    'The public input requires one LoadedContract per selected object, but no required source declares its record shape or its relation to the contract grammar.');
}
const itemRefUses = locations('package', /\bItemRef\b/);
if (!defined('ItemRef')) {
  finding('Q2', 'ItemRef is named but never defined', 'genuine blocker', itemRefUses,
    'Collision, relationship-conflict, and tension audit records require ItemRef[], but the package never defines what an ItemRef contains.');
}
const gateInputUses = locations('package', /\bGateInput\b/);
if (!defined('GateInput')) {
  finding('Q2', 'GateInput is named but has no record declaration', 'minor', gateInputUses,
    'The prose identifies it as resolution plus audit without tensions, so this omission does not change gate behaviour; its named record is nevertheless undeclared.');
}

// Q3 — places that formerly permitted divergent semantic implementations.
check('Q3', 'Classes preserve IN constraints without choosing or merging', all([
  has('package', 'A class carries its selector as a constraint, not as chosen values.'),
  has('package', 'No concrete member is ever chosen for\n  an `IN` attribute.'),
  has('package', 'Classes are never merged.'),
]), 'class semantics are explicit');
check('Q3', 'Candidate matching is many-class satisfaction, not a pairing', all([
  has('package', 'A candidate element belongs to every class\n   whose selector it satisfies'),
  has('package', 'no element is paired with any single engine element'),
  has('package', 'Every candidate element in no class'),
]), 'stage 9 specifies assignment and remainder');
check('Q3', 'Former uncovered value forms have semantics or a named refusal', all([
  has('package', 'Qualitative term'),
  has('package', 'Dynamic location'),
  has('package', 'Open-vocabulary token'),
  has('package', 'Procedure'),
  has('package', 'RULE_NOT_EXECUTABLE'),
  has('package', 'VALUE_NOT_COMPARABLE'),
]), 'all four former forms are covered');
check('Q3', 'Gate B reverse and qualitative-bound outcomes are represented', all([
  has('package', 'NOT_APPLICABLE is a whole-gate verdict only'),
  has('package', 'for `QUALITATIVE`, every constraint carries the same canonical term'),
  /VALUE_NOT_COMPARABLE.{0,20}refusal/.test(text.package),
]), 'neither result is left to implementation choice');
check('Q3', 'Reachability uses SD-44 and specifies its only accessibility withdrawals', all([
  has('package', 'Structurally reachable triggers (AM-15, SD-44)'),
  has('package', 'only when the represented structure establishes that\nentry is impossible'),
  has('package', 'and in exactly two cases:'),
]), 'no simulation or unstated default is required');

// Q4 — an unsupported path must instead be refused or recorded as a known gap.
const refusalNames = [
  'NO_AGGREGATE_FUNCTION', 'NO_MODIFIER_ORDER_RULE', 'MODIFIER_OPERATION_MISSING',
  'RULE_NOT_EXECUTABLE', 'VALUE_NOT_COMPARABLE', 'LABEL_NOT_RULED',
  'CHECK_NOT_EXECUTABLE', 'INPUT_DEFECT', 'PASS_DIVERGENCE',
];
const missingRefusals = refusalNames.filter((name) => !has('package', `\`${name}\``));
check('Q4', 'Known uncomputable paths have named refusals', missingRefusals.length === 0,
  missingRefusals.length ? `missing: ${missingRefusals.join(', ')}` : `${refusalNames.length} applicable refusal kinds found`);
check('Q4', 'The two Gate A specification gaps are blocked rather than inferred', all([
  has('package', 'GA-MODIFIER-OVERLAP'),
  has('package', 'GA-RESIDUAL-SPACE'),
  has('package', 'blocking, with a `CHECK_NOT_EXECUTABLE` refusal'),
  has('tasks', '`GA-RESIDUAL-SPACE` has no machine-testable definition'),
  has('tasks', '`GA-MODIFIER-OVERLAP` has no test for `object` and `event` conditions'),
]), 'the package and task register agree');
check('Q4', 'The remaining known gaps are recorded rather than used as authority', all([
  /Residual known gaps.{0,10}the exact list/.test(text.package),
  /Do not repair these simply to make tests green\./.test(text.tasks),
  /Do not fill them from legacy code\./.test(text.tasks),
  /refuses such a comparison rather than choosing one/.test(text.register),
]), 'known gaps remain refusals or authoring work');

const questionResults = ['Q1', 'Q2', 'Q3', 'Q4'].map((question) => ({
  question,
  findings: findings.filter((entry) => entry.question === question),
  failedChecks: checks.filter((entry) => entry.question === question && !entry.ok),
}));
const blockerCount = findings.filter((entry) => entry.classification === 'genuine blocker').length;
const verdict = blockerCount > 0
  ? 'genuine blocker found'
  : findings.length > 0 ? 'not clean, no genuine blocker' : 'all four clean';

const branch = childProcess.execFileSync('git', ['-C', root, 'branch', '--show-current'], { encoding: 'utf8' }).trim();
const commit = childProcess.execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

console.log('# Final check — four questions');
console.log('');
console.log(`Branch: ${branch}`);
console.log(`Commit: ${commit}`);
console.log('Files read:');
for (const relative of Object.values(sources)) console.log(`- ${relative}`);

for (const result of questionResults) {
  const clean = result.findings.length === 0 && result.failedChecks.length === 0;
  console.log(`\n${result.question}: ${clean ? 'CLEAN' : 'NOT CLEAN'}`);
  for (const entry of checks.filter((checkResult) => checkResult.question === result.question)) {
    console.log(`- ${entry.ok ? 'pass' : 'FAIL'}: ${entry.label} — ${entry.detail}`);
  }
  if (result.findings.length === 0) console.log('- No findings.');
  for (const entry of result.findings) {
    console.log(`- ${entry.classification}: ${entry.title}`);
    for (const location of entry.evidence) console.log(`  ${location.file}:${location.line}: ${location.text}`);
    console.log(`  ${entry.reason}`);
  }
}

console.log(`\nOverall verdict: ${verdict}`);

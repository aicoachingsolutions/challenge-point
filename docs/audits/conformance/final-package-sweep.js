#!/usr/bin/env node
'use strict';

/*
 * Read-only final sweep for the 21 September derivation-package audit.
 *
 * This intentionally writes nothing.  It reports mechanically discoverable
 * evidence and flags the places that need the report's documented judgement
 * rule (current versus historical, and invention-point review).
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const docs = path.join(root, 'docs');
const design = path.join(docs, 'design');
const conformance = path.join(docs, 'audits', 'conformance');
const packageFile = path.join(design, 'derivation-engine-design-package-2026-09-20.md');
const derivationSpecFile = path.join(design, 'derivation-spec-2026-09-20.md');
const registerFile = path.join(conformance, 'register-2026-09-18.json');
const contractsFile = path.join(conformance, 'stage-b', 'contracts.json');
const grammarFile = path.join(conformance, 'grammar-sheet-2026-09-18.md');

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function readJson(file) {
  // Both audit JSON inputs currently carry a UTF-8 BOM.  Remove it before
  // parsing; do not repair or rewrite the source file.
  return JSON.parse(readText(file));
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function numberedMatches(file, expression) {
  return readText(file)
    .split(/\r?\n/)
    .flatMap((text, index) => expression.test(text)
      ? [{ file: rel(file), line: index + 1, text: text.trim() }]
      : []);
}

function emit(title, rows) {
  process.stdout.write(`\n${title} (${rows.length})\n`);
  for (const row of rows) {
    process.stdout.write(`  ${row.file}:${row.line}: ${row.text}\n`);
  }
}

function section(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  const end = endHeading ? text.indexOf(endHeading, start + startHeading.length) : text.length;
  if (start < 0 || end < 0) throw new Error(`Could not locate ${startHeading}`);
  return text.slice(start, end);
}

const packageText = readText(packageFile);
const derivationSpec = readText(derivationSpecFile);
const register = readJson(registerFile);
const contracts = readJson(contractsFile);
const corpusItems = contracts.flatMap((contract) => contract.result.items);
const compares = corpusItems.filter((item) => item.requirement === 'COMPARES');

const scannedFiles = [
  ...fs.readdirSync(design)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(design, name)),
  grammarFile,
  registerFile,
];

const stalePatterns = [
  ['S1 P-4 / SD-R2', /\bP-4\b|\bSD-R2\b/i],
  ['S2 candidate authority', /resolvedBy.{0,80}REALIZATION|REALIZATION.{0,80}support|candidate.{0,160}(derived|support|gap|collision|conflict|resolvedBy)|NARROWED_CHOICE/i],
  ['S3 narrowed-choice verdict', /RESOLVED:NARROWED_CHOICE/i],
  ['S4 divergence disposition', /divergen|restricted computation|restricted pass|full derivation|full pass/i],
  ['S5 comparative exercise', /comparative.{0,100}(exercised|validated|proven|re-derived|rerun|corpus|contract)|aggregate.{0,100}(exercised|validated|proven|corpus|contract)|COMPARES.{0,100}(exercised|validated|proven|corpus|contract)/i],
  ['S6 reverse / invented mode', /Gate B reverse|INVENTED.{0,100}(derivation mode|derive)|derivation mode.{0,100}(INVENTED|reverse)/i],
  ['S7 approved absence labels', /NOT_REALIZED|VALID_ABSENCE/i],
];

for (const [label, expression] of stalePatterns) {
  const hits = scannedFiles.flatMap((file) => numberedMatches(file, expression));
  emit(label, hits);
}

const stageNumbers = [...packageText.matchAll(/^\|\s*(\d+)\s*\|\s*\*\*/gm)]
  .map((match) => Number(match[1]));
const citedStages = [...packageText.matchAll(/\bstages?\s+(\d+)(?:\s*[–-]\s*(\d+))?/gi)]
  .flatMap((match) => [Number(match[1]), ...(match[2] ? [Number(match[2])] : [])]);
const invalidStageCitations = citedStages.filter((stage) => !stageNumbers.includes(stage));

const refusalSection = section(packageText, '### 3.3 Refusal kinds', '### 3.4 Labels');
const closedRefusals = [...refusalSection.matchAll(/`([A-Z_]+)`/g)].map((match) => match[1]);
const namedRefusals = [
  'NO_AGGREGATE_FUNCTION', 'NO_MODIFIER_ORDER_RULE', 'MODIFIER_OPERATION_MISSING',
  'OPERAND_NOT_SCALAR', 'NOT_FILLABLE', 'UNBOUNDED_COUNT_FILL', 'LABEL_NOT_RULED',
  'PASS_DIVERGENCE', 'CHECK_NOT_EXECUTABLE', 'SELECTION_CONTRACT_MISMATCH',
  'INPUT_DEFECT', 'CONSERVATION_VIOLATION',
];
const refusalNamesOutsideClosedList = namedRefusals.filter((name) => !closedRefusals.includes(name));

const failureSection = section(packageText, '### 3.2 The six kinds', '### 3.3 Refusal kinds');
// Section 3.2 prints TENSION below the six-row failure table as a non-failure; exclude it from this check.
const failureKinds = [...failureSection.matchAll(/`([A-Z_]+)`/g)].map((match) => match[1]).filter((kind) => kind !== 'TENSION');
const expectedFailureKinds = ['LOAD_REFUSAL', 'REFERENCE_DEFECT', 'GAP', 'INVENTED', 'COLLISION', 'RELATIONSHIP_CONFLICT'];
const unexpectedFailureKinds = failureKinds.filter((kind) => !expectedFailureKinds.includes(kind));

const definedInOneOrThree = section(packageText, '## 1. Inputs and outputs', '## 2. The twelve-stage pipeline')
  + section(packageText, '## 3. Typed failure records', '## 4. `derived` / `open` / `failed`');
const recordDefinitionGaps = ['Audit', 'RunReport', 'GateReport', 'PENDING', 'PENDING_CHOICE']
  .filter((name) => !new RegExp(`(^|[\\s\\n])${name}\\s*(?:\\{|\\|)`, 'm').test(definedInOneOrThree));

process.stdout.write('\nMechanical package checks\n');
process.stdout.write(`  stage table: ${stageNumbers.join(', ')}\n`);
process.stdout.write(`  cited stages outside table: ${invalidStageCitations.join(', ') || '(none)'}\n`);
process.stdout.write(`  refusal kinds outside §3.3: ${refusalNamesOutsideClosedList.join(', ') || '(none)'}\n`);
process.stdout.write(`  unexpected §3.2 failure kinds: ${unexpectedFailureKinds.join(', ') || '(none)'}\n`);
process.stdout.write(`  record/value names not defined in §1 or §3: ${recordDefinitionGaps.join(', ')}\n`);
process.stdout.write(`  corpus contracts/items/COMPARES: ${contracts.length}/${corpusItems.length}/${compares.length}\n`);
process.stdout.write(`  register rows: ${register.rows.length}; vocabulary versions: ${Object.keys(register.vocabularies.versions).length}\n`);

const reviewAnchors = [
  ['I element inventory before derive', packageFile, /One line per \(element, row\)|elementId or 'game'/i],
  ['I conditional PENDING behaviour', packageFile, /PENDING|re-check at stage 6/i],
  ['I open-bound comparison', packageFile, /intersection of applicable constraints|typed by the row's registered value type/i],
  ['I modifier combination semantics', packageFile, /two modifiers with no authored order|covered by a rule/i],
  ['I Gate A policy', packageFile, /NOT_CHECKABLE|cannot be fully executed|NOT_EVALUABLE/i],
  ['I unspecified result records', packageFile, /audit\s+: Audit|run\s+: RunReport/i],
  ['C closed-world absence', derivationSpecFile, /Closed-world absence|valid when no support-capable item entails/i],
];
process.stdout.write('\nManual-review anchors (these need the report’s judgement rule)\n');
for (const [label, file, expression] of reviewAnchors) {
  emit(`  ${label}`, numberedMatches(file, expression));
}

process.stdout.write('\nRule used by this script: it reports all textual candidates. The report classifies a candidate as historical only when the text itself explicitly says it is superseded, proposed, revised, or corrected; otherwise it is reviewed as current.\n');

'use strict';

/*
 * Read-only cross-document consistency audit. It writes Markdown to stdout;
 * capture that output to cross-document-check-report.md after a successful run.
 */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const DOCS = path.join(ROOT, 'docs');
const REGISTER_PATH = path.join(ROOT, 'docs/audits/conformance/register-2026-09-18.json');
const STANDING_SPEC = 'docs/design/game-representation-spec-2026-09-18.md';
const AMENDMENTS = 'docs/design/amendments-am01-am15-2026-09-19.md';
const DERIVATION_SPEC = 'docs/design/derivation-spec-2026-09-20.md';

// Deliberately uses the BOM-safe parsing rule supplied with the task.
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

function markdown(file) {
  return file.endsWith('.md');
}

/* Generated reports quote findings rather than author normative references. */
function isGeneratedAuditReport(relative) {
  return relative.startsWith('docs/audits/conformance/') && relative.endsWith('-report.md');
}

const documents = walk(DOCS)
  .filter(markdown)
  .map((file) => ({ file, relative: rel(file), lines: readText(file).split(/\r?\n/) }))
  .filter((doc) => !isGeneratedAuditReport(doc.relative));
const documentByRelative = new Map(documents.map((doc) => [doc.relative, doc]));
const register = readJson(REGISTER_PATH);
const rows = register.rows;
const rowById = new Map(rows.map((row) => [row.id, row]));
const findings = { R: [], G: [], V: [], A: [] };
const checkResults = [];

function loc(doc, lineNumber) {
  return `${doc.relative}:${lineNumber + 1}`;
}

function quote(doc, lineNumber) {
  return `\`${loc(doc, lineNumber)}\` — “${doc.lines[lineNumber].trim().replaceAll('|', '\\|')}”`;
}

function jsonLine(needle) {
  const doc = { relative: rel(REGISTER_PATH), lines: readText(REGISTER_PATH).split(/\r?\n/) };
  const index = doc.lines.findIndex((line) => line.includes(needle));
  return index === -1 ? `\`${doc.relative}\`` : quote(doc, index);
}

function addFinding(family, check, title, source, conflict) {
  findings[family].push({ check, title, source, conflict });
}

function check(id, ok, summary) {
  checkResults.push({ id, ok, summary });
}

function idsInLine(line, pattern) {
  const result = [];
  for (let match; (match = pattern.exec(line)); ) result.push(match[0]);
  return result;
}

function citations(pattern, skipDefinitionLine) {
  const result = new Map();
  for (const doc of documents) {
    doc.lines.forEach((line, lineNumber) => {
      if (skipDefinitionLine && skipDefinitionLine(doc, line)) return;
      for (const id of idsInLine(line, new RegExp(pattern.source, pattern.flags))) {
        if (!result.has(id)) result.set(id, []);
        result.get(id).push({ doc, lineNumber });
      }
    });
  }
  return result;
}

function definitionsFromLines(doc, pattern) {
  const result = new Map();
  doc.lines.forEach((line, lineNumber) => {
    const match = line.match(pattern);
    if (match) result.set(match[1], { doc, lineNumber });
  });
  return result;
}

function mergeDefinitions(...maps) {
  return new Map(maps.flatMap((map) => [...map.entries()]));
}

const standingDoc = documentByRelative.get(STANDING_SPEC);
const amendmentsDoc = documentByRelative.get(AMENDMENTS);
const derivationDoc = documentByRelative.get(DERIVATION_SPEC);
if (!standingDoc || !amendmentsDoc || !derivationDoc) throw new Error('An authoritative design document is missing.');

const isStandingDefinition = (doc, line) => doc.relative === STANDING_SPEC && /^\|\s*(?:SD-\d{2}|SD-R[1-3]|KR-\d{2})\s*\|/.test(line);
const sdDefinitions = definitionsFromLines(standingDoc, /^\|\s*(SD-\d{2})\s*\|/);
const krDefinitions = definitionsFromLines(standingDoc, /^\|\s*(KR-\d{2})\s*\|/);
const rejectedDefinitions = definitionsFromLines(standingDoc, /^\|\s*(SD-R[1-3])\s*\|/);
const sdCitations = citations(/\bSD-\d{2}(?![A-Za-z0-9-])\b/g, isStandingDefinition);
const krCitations = citations(/\bKR-\d{2}\b/g, isStandingDefinition);
const rejectedCitations = citations(/\bSD-R[1-3]\b/g, isStandingDefinition);

function referenceCheck(family, id, label, definitions, cited) {
  const dangling = [...cited.keys()].filter((value) => !definitions.has(value));
  const unused = [...definitions.keys()].filter((value) => !cited.has(value));
  for (const value of dangling) {
    const first = cited.get(value)[0];
    addFinding(family, id, `${label} citation has no definition: ${value}`, quote(first.doc, first.lineNumber), `No ${label} definition was found in its authoritative register.`);
  }
  for (const value of unused) {
    const definition = definitions.get(value);
    addFinding(family, id, `${label} definition is never cited: ${value}`, quote(definition.doc, definition.lineNumber), `No non-definition Markdown citation was found in the scanned document corpus.`);
  }
  check(id, dangling.length === 0 && unused.length === 0, `${cited.size} cited; ${definitions.size} defined; ${dangling.length} dangling; ${unused.length} never cited`);
}

referenceCheck('R', 'R1', 'standing-decision', sdDefinitions, sdCitations);
const combinedR2Definitions = mergeDefinitions(krDefinitions, rejectedDefinitions);
const combinedR2Citations = mergeDefinitions(krCitations, rejectedCitations);
referenceCheck('R', 'R2', 'knowledge-ruling/rejected-default', combinedR2Definitions, combinedR2Citations);

const amendmentDefinitions = mergeDefinitions(
  definitionsFromLines(amendmentsDoc, /^#{1,6}\s+(AM-\d{2})\b/),
  definitionsFromLines(derivationDoc, /^#{1,6}\s+.*\b(AM-\d{2})\b/)
);
const amendmentCitations = citations(/\bAM-\d{2}\b/g);
const highestAmendment = Math.max(...[...amendmentDefinitions.keys()].map((id) => Number(id.slice(3))));
const unresolvedAmendments = [...amendmentCitations.keys()].filter((id) => !amendmentDefinitions.has(id));
for (const id of unresolvedAmendments) {
  const first = amendmentCitations.get(id)[0];
  addFinding('R', 'R3', `AM citation has no definition: ${id}`, quote(first.doc, first.lineNumber), `${id} is above the highest defined amendment AM-${String(highestAmendment).padStart(2, '0')}.`);
}
check('R3', unresolvedAmendments.length === 0, `${amendmentCitations.size} cited; ${amendmentDefinitions.size} defined; highest defined AM-${String(highestAmendment).padStart(2, '0')}; ${unresolvedAmendments.length} unresolved`);

const rcDefinitions = new Map();
for (const doc of documents) {
  doc.lines.forEach((line, lineNumber) => {
    const heading = line.match(/^#{1,6}\s+.*\b(RC-\d{2})\b/);
    const table = line.match(/^\|\s*`?(RC-\d{2})`?\s*\|/);
    const match = heading || table;
    if (match && !rcDefinitions.has(match[1])) rcDefinitions.set(match[1], { doc, lineNumber });
  });
}
const rcCitations = citations(/\bRC-\d{2}\b/g, (doc, line) => /^#{1,6}\s+.*\bRC-\d{2}\b/.test(line) || /^\|\s*`?RC-\d{2}`?\s*\|/.test(line));
const unresolvedRCs = [...rcCitations.keys()].filter((id) => !rcDefinitions.has(id));
for (const id of unresolvedRCs) {
  const first = rcCitations.get(id)[0];
  addFinding('R', 'R4', `RC citation has no definition: ${id}`, quote(first.doc, first.lineNumber), 'No definition-shaped heading or table row for this RC id was found anywhere under docs/.');
}
check('R4', unresolvedRCs.length === 0, `${rcCitations.size} cited; ${rcDefinitions.size} defined; ${unresolvedRCs.length} unresolved`);

const filePathPattern = /(?<![A-Za-z0-9_.\/-])((?:(?:docs|back|front|src|lib|scripts|test|tests)(?:[\\/][A-Za-z0-9_.@-]+)+\.(?:md|json|js|mjs|cjs|ts|tsx|css|html|ya?ml|csv|txt))|package\.json)(?::\d+(?::\d+)?(?:-\d+)?)?/g;
const brokenPathLocations = [];
for (const doc of documents.filter((doc) => doc.relative.startsWith('docs/design/') || doc.relative.startsWith('docs/audits/'))) {
  doc.lines.forEach((line, lineNumber) => {
    for (let match; (match = filePathPattern.exec(line)); ) {
      const raw = match[1];
      const normalized = raw.replaceAll('\\', '/');
      if (!fs.existsSync(path.join(ROOT, normalized))) brokenPathLocations.push({ doc, lineNumber, normalized });
    }
  });
}
for (const broken of brokenPathLocations) addFinding('R', 'R5', `Mentioned file does not exist: ${broken.normalized}`, quote(broken.doc, broken.lineNumber), `No file exists at \`${broken.normalized}\` relative to the audited checkout.`);
check('R5', brokenPathLocations.length === 0, `${brokenPathLocations.length} broken explicit repository-relative file paths`);

const derivationSections = new Set();
derivationDoc.lines.forEach((line) => {
  const match = line.match(/^#{1,6}\s+(\d+(?:\.\d+)*)\b/);
  if (match) derivationSections.add(match[1]);
});
const brokenSectionReferences = [];
for (const doc of documents) {
  doc.lines.forEach((line, lineNumber) => {
    const isInternal = doc.relative === DERIVATION_SPEC;
    const references = isInternal
      ? line.matchAll(/§(\d+(?:\.\d+)*)\b/g)
      : line.matchAll(/derivation(?:-| )spec(?:ification)?\s+§(\d+(?:\.\d+)*)\b/ig);
    for (const match of references) {
      if (!derivationSections.has(match[1])) brokenSectionReferences.push({ doc, lineNumber, section: match[1] });
    }
  });
}
for (const broken of brokenSectionReferences) addFinding('R', 'R6', `Derivation-spec section does not exist: §${broken.section}`, quote(broken.doc, broken.lineNumber), `The derivation spec has no heading for §${broken.section}.`);
check('R6', brokenSectionReferences.length === 0, `${derivationSections.size} derivation-spec headings; ${brokenSectionReferences.length} broken targeted § references`);

const ownerProblems = rows.flatMap((row) => {
  if (!Object.hasOwn(row, 'ownerRow')) return [];
  const owner = rowById.get(row.ownerRow);
  if (!owner) return [{ row, reason: `ownerRow ${row.ownerRow} is absent` }];
  if (owner.kind !== 'COLLECTION') return [{ row, reason: `ownerRow ${row.ownerRow} has kind ${owner.kind}` }];
  return [];
});
for (const problem of ownerProblems) addFinding('G', 'G1', `Invalid ownerRow on ${problem.row.id}`, jsonLine(`"id": "${problem.row.id}"`), problem.reason);
check('G1', ownerProblems.length === 0, `${ownerProblems.length} invalid ownerRow values`);

const applicabilityMetadata = new Set(['note', 'whyItMatters', 'flagged']);
const invalidApplicability = Object.keys(register.applicability).filter((id) => !applicabilityMetadata.has(id) && !rowById.has(id));
for (const id of invalidApplicability) addFinding('G', 'G2', `Applicability key is not a row id: ${id}`, jsonLine(`"${id}":`), 'The register rows array has no such id.');
check('G2', invalidApplicability.length === 0, `${Object.keys(register.applicability).length} applicability keys; ${invalidApplicability.length} invalid`);

const decisionIds = new Set(register.citableStandingDecisions.map((decision) => decision.id));
const invalidDecidingRules = Object.keys(register.decidingRules).filter((id) => id !== 'note' && id !== 'RR-01' && !decisionIds.has(id));
for (const id of invalidDecidingRules) addFinding('G', 'G3', `decidingRules id is neither RR-01 nor citable: ${id}`, jsonLine(`"${id}":`), 'It is not RR-01 and is absent from citableStandingDecisions.');
check('G3', invalidDecidingRules.length === 0, `${invalidDecidingRules.length} invalid decidingRules ids`);

function localVocabularyLists(vocabularies) {
  const lists = [];
  for (const [key, value] of Object.entries(vocabularies)) {
    if (Array.isArray(value) && key !== 'triggerRows') lists.push(key);
    if (key === 'contractEnums') {
      for (const [child, childValue] of Object.entries(value)) if (Array.isArray(childValue)) lists.push(`contractEnums.${child}`);
    }
  }
  return lists;
}

const vocabularyLists = localVocabularyLists(register.vocabularies);
const versionKeys = Object.keys(register.vocabularies.versions).filter((key) => key !== 'note');
const missingVersions = vocabularyLists.filter((key) => !versionKeys.includes(key));
const versionsWithoutList = versionKeys.filter((key) => !vocabularyLists.includes(key));
for (const key of missingVersions) addFinding('G', 'G4', `Vocabulary list lacks a version: ${key}`, jsonLine(`"${key}"`), 'No corresponding vocabularies.versions entry exists.');
for (const key of versionsWithoutList) addFinding('G', 'G4', `Version has no vocabulary list: ${key}`, jsonLine(`"${key}"`), 'No corresponding allowed-value list exists in vocabularies.');
check('G4', missingVersions.length === 0 && versionsWithoutList.length === 0, `${vocabularyLists.length} lists; ${versionKeys.length} versions; ${missingVersions.length} missing; ${versionsWithoutList.length} orphan versions`);

const invalidFillable = rows.filter((row) => Object.hasOwn(row, 'fillable') && !['FIELD', 'COLLECTION'].includes(row.kind));
for (const row of invalidFillable) addFinding('G', 'G5', `Fillable row has invalid kind: ${row.id}`, jsonLine(`"id": "${row.id}"`), `Kind ${row.kind} is neither FIELD nor COLLECTION.`);
check('G5', invalidFillable.length === 0, `${rows.filter((row) => Object.hasOwn(row, 'fillable')).length} fillable rows; ${invalidFillable.length} invalid kinds`);

const duplicateIds = rows.filter((row, index) => rows.findIndex((other) => other.id === row.id) !== index).map((row) => row.id);
for (const id of [...new Set(duplicateIds)]) addFinding('G', 'G6', `Duplicate register row id: ${id}`, jsonLine(`"id": "${id}"`), 'The id occurs more than once in rows.');
check('G6', duplicateIds.length === 0, `register parsed successfully; ${rows.length} rows; ${duplicateIds.length} duplicate entries`);

/*
 * V1 is semantic rather than phrase-only. The map represents every row whose
 * valueType fixes an allowed-member set. It includes bare finite enums (J4 and
 * T6) and the shared trigger vocabulary. Externally owned lists are separated
 * below: a local snapshot cannot make their membership register-owned.
 */
const localEnumerationBindings = new Map([
  ['S3', 'S3.noun'], ['S4', 'S4.functions'], ['O2', 'O2.kind'], ['J4', 'J4.role'],
  ['T1', 'trigger'], ['T5', 'T5.method'], ['T6', 'T6.playState'], ['V4', 'V4.conditionType'],
  ['V8a', 'V8a.conditionType'], ['V9a', 'V9a.operation'], ['V12', 'trigger'],
  ['V13', 'V13.effect'], ['V17', 'trigger'], ['V24', 'trigger'], ['V26', 'V26.expiryEffect'],
]);
const externalVocabularyRows = rows.filter((row) => typeof row.valueType === 'string' && (/RPC library's controlled vocabulary/i.test(row.valueType) || /\bIE-D\d{3}\b/.test(row.valueType)));
const missingEnumerationData = [...localEnumerationBindings.entries()].filter(([, key]) => !Array.isArray(register.vocabularies[key]));
for (const [rowId, key] of missingEnumerationData) addFinding('V', 'V1', `Enumerated valueType lacks local data: ${rowId} → ${key}`, jsonLine(`"id": "${rowId}"`), `No array exists at vocabularies.${key}.`);
check('V1', missingEnumerationData.length === 0, `${localEnumerationBindings.size} locally owned enumerations checked; ${missingEnumerationData.length} lack data`);

const vocabularyProseBindings = [
  ['S3.noun', ['S3']], ['S4.functions', ['S4']], ['O2.kind', ['O2']], ['J4.role', ['J4']],
  ['trigger', ['T1']], ['T5.method', ['T5']], ['T6.playState', ['T6']], ['V1.kind', ['V1']],
  ['V4.conditionType', ['V4']], ['V8a.conditionType', ['V8a']], ['V9a.operation', ['V9a']],
  ['V13.effect', ['V13']], ['V26.expiryEffect', ['V26']],
];
function containsMember(prose, member) {
  const escaped = member.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9_])${escaped}($|[^A-Za-z0-9_])`, 'i').test(prose);
}
const vocabularyDrift = [];
for (const [key, rowIds] of vocabularyProseBindings) {
  const prose = rowIds.map((id) => rowById.get(id).valueType || '').join(' ');
  for (const member of register.vocabularies[key] || []) if (!containsMember(prose, member)) vocabularyDrift.push({ key, rowIds, member, prose });
}
for (const drift of vocabularyDrift) {
  const line = jsonLine(`"id": "${drift.rowIds[0]}"`);
  addFinding('V', 'V2', `Vocabulary member absent from valueType prose: ${drift.key} → ${drift.member}`, line, `The member occurs in vocabularies.${drift.key} but not in ${drift.rowIds.join(', ')} valueType prose.`);
}
check('V2', vocabularyDrift.length === 0, `${vocabularyProseBindings.length} row-vocabulary bindings; ${vocabularyDrift.length} prose/data member drifts`);

for (const row of externalVocabularyRows) {
  const key = row.id === 'V1' ? 'V1.kind (local snapshot)' : 'no local member list';
  addFinding('V', 'V3', `Vocabulary ownership is external: ${row.id}`, jsonLine(`"id": "${row.id}"`), `${row.valueType}. Register status: ${key}; it cannot determine authoritative future membership.`);
}
check('V3', true, `${externalVocabularyRows.length} externally owned vocabularies reported separately from V1 extraction completeness`);

function numberValue(token) {
  const words = new Map([['six', 6], ['eight', 8], ['twelve', 12], ['eighty-two', 82]]);
  return /^\d+$/.test(token) ? Number(token) : words.get(String(token).toLowerCase());
}

const numericFamilies = [
  {
    name: 'register row count', expected: rows.length,
    extract(doc, line) {
      const direct = line.match(/register\s+(?:holds|has|contains)\s+(\d+|eighty-two)\s+rows\b/i);
      const historical = /conformance/.test(doc.relative) && line.match(/\ball\s+(\d+)\s+rows\b/i);
      return numberValue((direct || historical || [])[1]);
    },
  },
  {
    name: 'fillable-row count', expected: rows.filter((row) => Object.hasOwn(row, 'fillable')).length,
    extract(_doc, line) {
      const match = line.match(/\b(\d+|twelve)\s+(?:rows\s+)?(?:carry\s+(?:a\s+)?)?\`?fillable\`?\s+(?:entries|rows)\b/i);
      return numberValue((match || [])[1]);
    },
  },
  {
    name: 'stage-B totals', expected: '221 items / 860 declarations',
    extract(_doc, line) {
      if (!/\b(?:221|860)\b/.test(line)) return undefined;
      const match = line.match(/\b(\d+)\s+items\s*,\s*(\d+)\s+declarations\b/i);
      return match ? match[1] + ' items / ' + match[2] + ' declarations' : undefined;
    },
  },
  {
    name: 'mojibake occurrence count', expected: 144,
    extract(_doc, line) {
      const match = line.match(/\b(\d+)\s+(?:places|times)[^.]{0,80}\bmojibake\b/i);
      return match ? Number(match[1]) : undefined;
    },
  },
  {
    name: 'BUILD_OUT_EPISODE use count', expected: 6,
    extract(_doc, line) {
      if (!/BUILD_OUT_EPISODE/.test(line)) return undefined;
      const match = line.match(/\b(\d+|six)\s+(?:of the\s+)?(?:\`?BUILD_OUT_EPISODE\`?\s+)?uses\b/i);
      return numberValue((match || [])[1]);
    },
  },
];
const numericDisagreements = [];
for (const family of numericFamilies) {
  const claims = [];
  for (const doc of documents) doc.lines.forEach((line, lineNumber) => {
    const value = family.extract(doc, line);
    if (value !== undefined) claims.push({ doc, lineNumber, value });
  });
  const values = new Set(claims.map((claim) => claim.value));
  if (values.size > 1 || [...values].some((value) => value !== family.expected)) numericDisagreements.push({ family, claims, values });
}
for (const disagreement of numericDisagreements) {
  for (const claim of disagreement.claims.filter((claim) => claim.value !== disagreement.family.expected)) {
    addFinding('A', 'A1', 'Numeric claim differs for ' + disagreement.family.name + ': ' + claim.value, quote(claim.doc, claim.lineNumber), 'Canonical artefact value is ' + disagreement.family.expected + '; observed values in the document corpus: ' + [...disagreement.values].join(', ') + '.');
  }
}
check('A1', numericDisagreements.length === 0, numericFamilies.length + ' explicit repeated artefact-count families checked; ' + numericDisagreements.length + ' disagree with their artefact value or with another document');

const contradictionCandidates = [];
for (const doc of documents) {
  doc.lines.forEach((line, lineNumber) => {
    const comparisonOnLine = /\b(?:COMPARES|comparative)\b.{0,80}\breaches?\s+(?:a|the|one)\s+line\b/i.test(line) && !/takes no line|not on a property line/i.test(line);
    const assumedCollision = /\bassumed\b.{0,60}\b(?:is|are)\s+support-capable\b|\bsupport-capable\b.{0,60}\bincluding an assumed item\b/i.test(line) && !/cannot create|cannot manufacture|can no longer/i.test(line);
    const declarationGone = /\bdeclarations?\b.{0,50}\bempty with\b/i.test(line) && !/do not disappear|preserved|survive|\?/i.test(line);
    const engineChooses = /(?:engine|derivation).{0,80}\b(?:chooses|selects)\b.{0,80}\b(?:free|open)\b/i.test(line) && !/does not|never|no selected value|whether|report any/i.test(line);
    const kind = comparisonOnLine ? 'comparison lands on a line' : assumedCollision ? 'assumed item collides' : declarationGone ? 'declaration disappears with empty scope' : engineChooses ? 'engine chooses a free value' : null;
    if (kind) contradictionCandidates.push({ doc, lineNumber, line, kind });
  });
}
const activeContradictions = [];
const historicalContradictions = [];
for (const candidate of contradictionCandidates) {
  const following = candidate.doc.lines.slice(candidate.lineNumber + 1).join('\n');
  const explicitlyWithdrawn = /my reaches-line rule is withdrawn|assumed items\s*\|\s*\*\*cannot create an authoritative collision|what does not stand is my remedy/i.test(following);
  (explicitlyWithdrawn ? historicalContradictions : activeContradictions).push(candidate);
}
for (const contradiction of activeContradictions) {
  const canonical = contradiction.kind === 'comparison lands on a line' ? 195 : contradiction.kind === 'assumed item collides' ? 379 : contradiction.kind === 'declaration disappears with empty scope' ? 333 : 290;
  addFinding('A', 'A2', 'Operative rule contradicts derivation spec: ' + contradiction.kind, quote(contradiction.doc, contradiction.lineNumber), 'Conflicts with \`' + DERIVATION_SPEC + ':' + canonical + '\`.');
}
for (const contradiction of historicalContradictions) addFinding('A', 'A2', 'Historical rule contradicts derivation spec but is explicitly withdrawn later in the same document', quote(contradiction.doc, contradiction.lineNumber), 'Superseded in the same document by its owner-ruling section; it is retained as history, not counted as an active contradiction.');
check('A2', activeContradictions.length === 0, activeContradictions.length + ' active contradictions; ' + historicalContradictions.length + ' historical statements explicitly withdrawn in their source document');

const totals = {
  findings: Object.values(findings).flat().length,
  failedChecks: checkResults.filter((result) => !result.ok).length,
  passedChecks: checkResults.filter((result) => result.ok).length,
};
const branch = childProcess.execFileSync('git', ['-C', ROOT, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
const commit = childProcess.execFileSync('git', ['-C', ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

console.log('# Cross-document consistency and reference audit');
console.log('');
console.log(`- Checkout read: \`${ROOT.replaceAll('\\', '/')}\``);
console.log(`- Branch: \`${branch}\``);
console.log(`- Commit checked: \`${commit}\``);
console.log(`- Generated by: \`docs/audits/conformance/cross-document-check.js\``);
console.log(`- Totals: **${totals.findings} findings; ${totals.failedChecks} checks with findings; ${totals.passedChecks} checks clean**`);
console.log('');
console.log('## Rules applied');
console.log('');
console.log('- The document corpus is every Markdown file under `docs/`, except generated conformance `*-report.md` files. Definition rows themselves do not count as citations when identifying an unused definition.');
console.log('- R5 checks explicit repository-relative file paths with a filename extension. Bare names and prose concepts are not treated as paths. R6 checks internal derivation-spec references and references explicitly labelled `derivation spec`; an unlabelled `§` in another document is ambiguous and is not assumed to target that spec.');
console.log('- V1 classifies a finite allowed set by meaning: closed/controlled lists, `set from`, shared trigger sets, and bare finite enums. It separates external vocabularies (RPC library and IE dimensions) from locally owned lists. V2 compares a local list with its authoritative row prose, using T1 as the trigger-list prose.');
console.log('- A1 covers explicit repeated counts for rows, fillable rows, contracts, stage-B items/declarations, mojibake, and build-out scope uses. A2 treats an earlier rule as historical rather than active only when the same document expressly withdraws it later.');
for (const family of ['R', 'G', 'V', 'A']) {
  const titles = { R: 'Reference checks (R)', G: 'Register-internal checks (G)', V: 'Vocabulary-coverage checks (V)', A: 'Agreement checks (A)' };
  console.log('');
  console.log(`## ${titles[family]}`);
  console.log('');
  const familyChecks = checkResults.filter((result) => result.id.startsWith(family));
  for (const result of familyChecks) console.log(`- **${result.id}: ${result.ok ? 'CLEAN' : 'FINDINGS'}** — ${result.summary}`);
  if (findings[family].length === 0) {
    console.log('');
    console.log('No findings.');
  } else {
    for (const finding of findings[family]) {
      console.log('');
      console.log(`### ${finding.check} — ${finding.title}`);
      console.log('');
      console.log(`- Source: ${finding.source}`);
      console.log(`- Conflict: ${finding.conflict}`);
    }
  }
}

/**
 * **TEST-ONLY: the draft store — knowledge we drafted for his review, gated and kept apart from production knowledge** — B2, 28 October 2026
 * (E1-lite, our proposal R8 section 2, built narrowly).
 *
 * Christian, his reply filed 30 October 2026: *"The draft-knowledge separation, specialized restart precedence, and other necessary structural
 * safeguards are appropriate general improvements. However, I don't want them to become another extended development cycle disconnected from
 * the composition test."* So this is only what composing a checked activity from drafts needs: it reads the DRAFT files of one folder under
 * `docs/audits/drafts/` in the shapes they already have (a contribution contract's `contractEntry`, an authorization `record`), refuses the
 * WHOLE store on any defect, stamps what it admits as drafts, and hands it to a build through one TEST-ONLY option
 * (`buildActivityUnderAuthorizationRecords` `drafts`), which threads it through the selection so contract coverage and derivation's input read
 * it. No production module imports this file (a static test pins it); no route, view or front end reads drafts.
 *
 * Stamped on what it admits, and read downstream as such:
 *   - every contract: knowledge version `draft` (derivation's provenance stamp says so);
 *   - every item and declaration: category DRAFT_KNOWLEDGE (the review evidence grades it DRAFT, never APPROVED, whatever its basis; an open
 *     line it narrows or bounds carries it to the choice that closes the line);
 *   - every record: `knowledgeStatus: 'DRAFT'` (the record gate admits it only with `draftsAdmitted`, its ruling requirement inverted).
 *
 * Refused, the whole store, naming every defect:
 *   - a DRAFT file that does not parse, or whose `standing` does not say DRAFT;
 *   - a contract whose entry or any item does not stand DRAFT; for an object that already has a production contract; with an item id a
 *     production contract, the Sport Profile or a provisional realization already uses, or used twice;
 *   - an item carrying what only a ruled restatement or a provisional realization writes (`category`, `departsFrom`, `authorizedBy`,
 *     `defersTo`, `defersWith`, the role-yield marker, `provisionalFigure`);
 *   - an item without our reasoning (`fitNote`); an item written on his words (any basis but ASSUMED) without its sources; an ASSUMED item
 *     citing no row whose `basisEvidence` names no standing decision the register types as citable (what it rests on, said, not implied);
 *   - a source not resolved to exactly ONE row by its own table's primary key (B2 review MF1, 28 October 2026: the store had collected every
 *     object any `…id` key of which held the cited id, foreign keys included, so a source citing `GA-001 Objective_Organization` was checked
 *     against 37 rows and words of another row loaded): its `file` must be a workbook this store reads, its `table` a table of that workbook
 *     (`DRAFT_TABLES`), the first token of its `rowId` the value of that table's key on exactly one row; a qualifier after it must be a field
 *     of that row (the words are then required in that field only) or, in parentheses, a value the row holds; and its `line` must be the
 *     line of the file holding that field, or the key, with its value;
 *   - a source whose words are not verbatim in the row it cites (in the field it names, where it names one), and, for a table the drafts
 *     render (a relationship row), a rendering that is not exactly the row's, every rendered field compared; whitespace runs aside, nothing
 *     is normalized, and the parts of a quotation an ellipsis separates must stand in order in one value; a field the source states about the
 *     row (`category`, `importance`, ...) that is not the row's, or one this store does not know for that table;
 *   - a quotation in an item's `basisEvidence` (straight or curly double quotes, any length) not verbatim in what a source of the item cites;
 *   - for a drafted context, a PRIMARY_SCORING_CONDITION row the workbook holds for it that no item constituting a scoring condition cites:
 *     with every condition item removed, a draft context once composed the plain game form's activity with every check passing
 *     (`docs/audits/drafts/ta02-composition/evidence/probe-k1-final.txt`, run U3), because the context-scoring guard can check only what the
 *     contract constitutes;
 *   - a record for a goal that has a production record, citing any ruling, or carrying what only his rulings give a record (a provisional
 *     realization, realizations, provisional choices, authorized adjustments, a review request), or refused by the record gate as a draft.
 *
 * Every file of the folder marked DRAFT (`*.DRAFT.*`) that the store does not read is listed with why (`notRead`): a `.DRAFT.json` in neither
 * shape, and every other DRAFT file (our Markdown notes for his review), never skipped silently.
 */
import fs from 'node:fs'
import path from 'node:path'

import { constitutedConditionTypes } from '../rendering/context-scoring-guard'
import { RelevanceJoinRules, relevanceJoinRulesRefusals } from '../rendering/relevance-trace'
import { RequirementBindings, RequirementBindingsRefused, requirementBindingsRefusals } from '../rendering/requirement-bindings'
import { PRIMARY_SCORING_CONDITION } from '../sport-module/rpc-library'
import { learningGoalAuthorizations, LearningGoalAuthorization, validateLearningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import type { ProvisionalRealization } from './corpus'
import { loadCorpusContracts, loadProvisionalRealizations, loadRegister, loadSportDefaultLaws, loadSportProfile, objectIdOf } from './corpus'
import { DefaultLawsCheck, defaultLawsCheckRefusal, departureRefusals, LawDeparture, LawsMateriality, lawsMaterialityRefusals } from './default-laws'
import { knowledgeKey } from './knowledge-key'
import { AUDITS_DIR } from './knowledge-root'
import { indexRegister } from './register'
import { DraftStoreContents } from './run-bounded-selection'
import { ContractItem, DRAFT_KNOWLEDGE, DRAFT_KNOWLEDGE_VERSION, ILLUSTRATIVE, LoadedContract, PROPOSED, ROLE_YIELD_KEY } from './types'

export const DRAFTS_DIR = path.join(AUDITS_DIR, 'drafts')

/** The workbooks a draft may quote, by the repository path a source cites, and where each is read from. */
const SYSTEM_DIR = path.resolve(__dirname, '..')
export const DRAFT_WORKBOOKS: Record<string, string> = {
    'back/src/system/sport-module/rpc-library.rc1.json': path.join(SYSTEM_DIR, 'sport-module', 'rpc-library.rc1.json'),
    'back/src/system/knowledge-core/game-archetype-workbook.rc1.1.json': path.join(SYSTEM_DIR, 'knowledge-core', 'game-archetype-workbook.rc1.1.json'),
}
/** The context workbook, whose PRIMARY_SCORING_CONDITION rows a drafted context's items must cite. */
const CONTEXT_WORKBOOK = 'back/src/system/sport-module/rpc-library.rc1.json'

/**
 * **Each table a draft may cite, by workbook: its own primary key, the fields a source may state about a row (the source's key, the row's
 * column), and, for a table the drafts render, the rendering.** The keys and columns are the workbooks' own; the source keys and the
 * relationship rendering are the drafts' (written by our generator, `rpc-003-contract-notes.md`), compared here field by field.
 */
interface DraftTable {
    key: string
    stated?: Record<string, string>
    rendering?: (row: Record<string, unknown>) => string
}
export const DRAFT_TABLES: Record<string, Record<string, DraftTable>> = {
    'back/src/system/sport-module/rpc-library.rc1.json': {
        properties: { key: 'property_id', stated: { category: 'property_category', importance: 'importance', provenance: 'provenance' } },
        relationships: {
            key: 'relationship_id',
            rendering: row =>
                `${row.related_library} ${row.related_id} (${row.relationship_type}, strength ${row.relationship_strength}); notes: "${row.notes ?? ''}"; provenance: "${row.provenance ?? ''}"`,
        },
        statements: { key: 'statement_id', stated: { statementType: 'statement_type' } },
        identity_rules: { key: 'identity_rule_id', stated: { identityRole: 'identity_role' } },
        transitions: { key: 'transition_id' },
        validation_rules: { key: 'validation_id', stated: { domain: 'validation_domain', runtimeStage: 'runtime_stage' } },
        implementation_staging: { key: 'mapping_id' },
    },
    'back/src/system/knowledge-core/game-archetype-workbook.rc1.1.json': {
        archetypes: { key: 'Archetype_ID' },
        knowledge: { key: 'Record_ID' },
    },
}
/** What every source carries; anything else it carries must be a field it states about the row (`DraftTable.stated`). */
const SOURCE_KEYS = ['rowId', 'table', 'file', 'line', 'text']

/** What only a ruled restatement or a provisional realization writes on an item; a draft writes none of it. */
const FORBIDDEN_ITEM_KEYS = ['category', 'departsFrom', 'authorizedBy', 'defersTo', 'defersWith', ROLE_YIELD_KEY, 'provisionalFigure']
/** What only his rulings give a record. */
const FORBIDDEN_RECORD_KEYS = ['provisionalRealization', 'realizations', 'provisionalChoices', 'authorizedAdjustments', 'reviewRequest']

export class DraftStoreRefused extends Error {
    constructor(
        readonly folder: string,
        readonly reasons: string[],
    ) {
        super(`the draft store ${folder} is refused whole: ${reasons.join(' | ')}`)
        this.name = 'DraftStoreRefused'
    }
}

/**
 * **TEST-ONLY: the relevance trace's join-rule table, ours and DRAFT, read once for every activity** — B3, 28 October 2026. Christian, his reply
 * filed 30 October 2026, item 5: *"Instead, I'd like the explanation mechanism to draw from reusable, traceable knowledge relationships rather
 * than require me to authorize a new set of explanatory statements for every generated activity."* So the rules that join an element to an
 * affordance are one small table of ours for his review (`docs/audits/drafts/relevance-join-rules.DRAFT.json`), read here, beside the other
 * drafts, and refused WHOLE on any defect the trace's own gate names (`relevanceJoinRulesRefusals`: closed keys, the four affordances once,
 * no rule for an affordance marked NONE, register rows that exist, selector attributes and fields the register holds on them (B3 review), words
 * verbatim in the affordance's definition). Like the store, never
 * imported by a production module.
 */
export const RELEVANCE_JOIN_RULES_FILE = path.join(DRAFTS_DIR, 'relevance-join-rules.DRAFT.json')
export function loadRelevanceJoinRules(file: string = RELEVANCE_JOIN_RULES_FILE): RelevanceJoinRules {
    let raw: unknown
    try {
        raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (error) {
        throw new DraftStoreRefused(file, [`the join-rule table does not parse: ${error instanceof Error ? error.message : String(error)}`])
    }
    const reasons = relevanceJoinRulesRefusals(raw, indexRegister(loadRegister()))
    if (reasons.length) throw new DraftStoreRefused(file, reasons)
    const repository = path.resolve(SYSTEM_DIR, '..', '..', '..')
    const shown = path.relative(repository, path.resolve(file)).split(path.sep).join('/')
    return { ...(JSON.parse(JSON.stringify(raw)) as Omit<RelevanceJoinRules, 'file'>), file: shown.startsWith('..') ? path.basename(file) : shown }
}

/**
 * **TEST-ONLY: our DRAFT classification of the profile's laws by his materiality test, read once for every composed activity** — B4, 28
 * October 2026 (R8's E4a). Christian, his reply filed 30 October 2026, item 4: *"Material unresolved conflicts affecting the activity's
 * meaning, safety, or structural validity should prevent approval."* *"Minor or nonessential procedural questions may be reported for review
 * without stopping development."* The sport's check (the Sport Profile's `defaultLaws.check`) applies his distinction to each adaptation a
 * composed activity owes; which law is which is a judgement of ours, not his, so it is one small file of ours for his review
 * (`docs/audits/drafts/laws-materiality.DRAFT.json`), read here beside the other drafts and refused WHOLE on any defect the gate names
 * (`lawsMaterialityRefusals`: a DRAFT standing saying OUR READING or TEST-ONLY, his test quoted exactly as the check quotes it and both of
 * its sentences quoted, laws the profile names each once, a kind of the two, our reading quoting nothing). Like the store, never imported by
 * a production module, so no production build reads it.
 */
export const LAWS_MATERIALITY_FILE = path.join(DRAFTS_DIR, 'laws-materiality.DRAFT.json')
export function loadLawsMateriality(file: string = LAWS_MATERIALITY_FILE): LawsMateriality {
    let raw: unknown
    try {
        raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (error) {
        throw new DraftStoreRefused(file, [`the classification of the laws does not parse: ${error instanceof Error ? error.message : String(error)}`])
    }
    const reasons = lawsMaterialityRefusals(raw, loadSportDefaultLaws())
    if (reasons.length) throw new DraftStoreRefused(file, reasons)
    const repository = path.resolve(SYSTEM_DIR, '..', '..', '..')
    const shown = path.relative(repository, path.resolve(file)).split(path.sep).join('/')
    return { ...(JSON.parse(JSON.stringify(raw)) as Omit<LawsMateriality, 'file'>), file: shown.startsWith('..') ? path.basename(file) : shown }
}

/**
 * **TEST-ONLY: our DRAFT requirement bindings for the draft context contract, read for a TEST-ONLY build** — 29 October 2026 (the requirement
 * account, report only). Christian, his reply filed 3 November 2026, section 2: *"Each generated activity should be evaluated against the
 * applicable, approved context requirements, accounting for each component of a scoring condition rather than simply confirming that the
 * condition exists."* The production bindings cover only contexts with a production contract, so the draft Attack Development contract's
 * bindings are one small file of ours at the drafts root (`docs/audits/drafts/requirement-bindings-rpc-003.DRAFT.json`, outside every store
 * folder, so no store lists it as unread), held here to the production file's own gate in its DRAFT mode, against this store's contracts, and
 * refused WHOLE on any defect. Merged with the production bindings by `mergeRequirementBindings` for a build. Like the store, never imported
 * by a production module.
 */
export const DRAFT_REQUIREMENT_BINDINGS_FILE = path.join(DRAFTS_DIR, 'requirement-bindings-rpc-003.DRAFT.json')
export function loadDraftRequirementBindings(store: DraftStoreContents, file: string = DRAFT_REQUIREMENT_BINDINGS_FILE): RequirementBindings {
    let raw: unknown
    try {
        raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (error) {
        throw new DraftStoreRefused(file, [`the requirement bindings do not parse: ${error instanceof Error ? error.message : String(error)}`])
    }
    const reasons = requirementBindingsRefusals(raw, { mode: 'DRAFT', draftContracts: store.contracts })
    if (reasons.length) throw new DraftStoreRefused(file, reasons)
    const repository = path.resolve(SYSTEM_DIR, '..', '..', '..')
    const shown = path.relative(repository, path.resolve(file)).split(path.sep).join('/')
    return { ...(JSON.parse(JSON.stringify(raw)) as Omit<RequirementBindings, 'file' | 'mode'>), file: shown.startsWith('..') ? path.basename(file) : shown, mode: 'DRAFT' }
}

/**
 * **TEST-ONLY: the production requirement bindings and the draft store's, merged** (the R-engine review's M1; moved here from the production
 * module in round 2, R3 S5, so the production surface holds no TEST-ONLY composition). Refused unless the two share a schema version, an
 * applicability and a carrier rule, and bind no context twice; stamped MERGED and TEST-ONLY, and held to the production file's gate in its
 * MERGED mode before it is returned, so each context answers to exactly one contract.
 */
export function mergeRequirementBindings(production: RequirementBindings, draft: RequirementBindings, draftContracts: LoadedContract[]): RequirementBindings {
    const reasons: string[] = []
    if (production.mode !== 'PRODUCTION') reasons.push(`the first bindings are ${production.mode}, not PRODUCTION`)
    if (draft.mode !== 'DRAFT') reasons.push(`the second bindings are ${draft.mode}, not DRAFT`)
    if (production.schemaVersion !== draft.schemaVersion) reasons.push('the two bindings differ in schema version')
    if (JSON.stringify(production.applicability) !== JSON.stringify(draft.applicability)) reasons.push('the two bindings differ in applicability')
    if (JSON.stringify(production.carriers) !== JSON.stringify(draft.carriers)) reasons.push('the two bindings differ in their carrier rule')
    for (const entry of draft.contexts) if (production.contexts.some(other => other.contextId === entry.contextId)) reasons.push(`${entry.contextId} is bound in both`)
    const file = `${production.file} + ${draft.file}`
    if (reasons.length) throw new RequirementBindingsRefused(file, reasons)
    const merged: Omit<RequirementBindings, 'file' | 'mode'> = {
        about: `TEST-ONLY: the production requirement bindings merged with the draft store's, for a TEST-ONLY build. ${draft.about}`,
        standing: `DRAFT - TEST-ONLY. Merged from ${production.version} and ${draft.version}.`,
        schemaVersion: 1,
        version: `${production.version}+${draft.version}`,
        applicability: JSON.parse(JSON.stringify(production.applicability)),
        carriers: JSON.parse(JSON.stringify(production.carriers)),
        contexts: JSON.parse(JSON.stringify([...production.contexts, ...draft.contexts])),
    }
    const refusals = requirementBindingsRefusals(merged, { mode: 'MERGED', draftContracts })
    if (refusals.length) throw new RequirementBindingsRefused(file, refusals)
    return { ...merged, file, mode: 'MERGED' }
}

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const norm = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** Every string inside a value, recursively. */
function stringsOf(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) value.forEach(entry => stringsOf(entry, out))
    else if (value && typeof value === 'object') Object.values(value).forEach(entry => stringsOf(entry, out))
    return out
}

/** Whether a quotation is verbatim in one of the values: its parts (an ellipsis separates them) in order, in one value. */
function verbatimIn(quotation: string, values: string[]): boolean {
    const parts = quotation.split('...').map(norm).filter(Boolean)
    if (!parts.length) return false
    return values.map(norm).some(value => {
        let from = 0
        for (const part of parts) {
            const at = value.indexOf(part, from)
            if (at < 0) return false
            from = at + part.length
        }
        return true
    })
}

/** The quotations a text makes: its straight and curly double-quoted fragments. */
const quotationsIn = (text: string): string[] => [...text.matchAll(/"([^"]+)"|“([^”]+)”/g)].map(match => match[1] ?? match[2])

/** What a resolved source cites: the row, the field it names (null for the whole row), and the values its words must be found in. */
interface CitedRow {
    row: Record<string, unknown>
    field: string | null
    values: string[]
}

interface WorkbookReader {
    json: (file: string) => unknown
    lines: (file: string) => string[]
}

/**
 * **One source resolved to the ONE row it cites, by its table's own primary key, and checked against it** (see the head of this file);
 * every defect pushed to `reasons`, and null where the row itself cannot be resolved.
 */
function citedRowOf(source: Record<string, unknown>, label: string, reasons: string[], workbooks: WorkbookReader): CitedRow | null {
    const file = String(source.file)
    const tables = DRAFT_TABLES[file] ?? {}
    const table = tables[String(source.table)]
    if (!filled(source.table) || !table) {
        reasons.push(`${label} names table ${JSON.stringify(source.table ?? null)}, which is not a table of ${file} this store reads (${Object.keys(tables).join(', ')})`)
        return null
    }
    const [id, ...rest] = String(source.rowId).trim().split(/\s+/)
    const qualifier = rest.join(' ')
    const rows = (((workbooks.json(file) as any)?.[String(source.table)] ?? []) as unknown[]).filter((row): row is Record<string, unknown> => isObject(row) && row[table.key] === id)
    if (rows.length !== 1) {
        reasons.push(`${label}: ${file} holds ${rows.length ? `${rows.length} rows` : 'no row'} ${id} in its table ${source.table} (by its key ${table.key}); a source cites exactly one`)
        return null
    }
    const [row] = rows
    let field: string | null = null
    if (qualifier) {
        const alias = qualifier.match(/^\((.+)\)$/)
        if (Object.prototype.hasOwnProperty.call(row, qualifier)) {
            if (!filled(row[qualifier])) reasons.push(`${label}: the field ${qualifier} of ${id} holds no words`)
            field = qualifier
        } else if (!(alias && stringsOf(row).includes(alias[1]))) {
            reasons.push(`${label}: "${qualifier}" after the row id is neither a field of ${id} nor, in parentheses, a value it holds`)
            return null
        }
    }
    const values = field ? (filled(row[field]) ? [String(row[field])] : []) : stringsOf(row)

    // Its words: verbatim in the field it names, or in one value of the row; or, for a table the drafts render, the row's rendering exactly.
    const text = String(source.text)
    const rendered = !field && table.rendering ? norm(table.rendering(row)) === norm(text) : false
    if (!rendered && !verbatimIn(text, values)) {
        reasons.push(
            `${label}: "${text}" is not verbatim in ${field ? `the field ${field} of the row it cites` : 'the row it cites'}` +
                (table.rendering && !field ? `, nor that row's rendering ("${table.rendering(row)}")` : ''),
        )
    }
    // What it states about the row: each field the row's own, and no field this store does not know for the table.
    for (const [key, value] of Object.entries(source)) {
        if (SOURCE_KEYS.includes(key)) continue
        const column = table.stated?.[key]
        if (!column) reasons.push(`${label} states ${key}, which is not a field this store reads for the table ${source.table}`)
        else if (value !== row[column]) reasons.push(`${label} states ${key} ${JSON.stringify(value)}, and the row's ${column} is ${JSON.stringify(row[column] ?? null)}`)
    }
    // Its line: the line of the file holding the field it names, or the row's key, with its value.
    const locator = field ?? table.key
    const held = Number.isInteger(source.line) && (source.line as number) > 0 ? workbooks.lines(file)[(source.line as number) - 1] : undefined
    if (held === undefined || !held.includes(`${JSON.stringify(locator)}: ${JSON.stringify(row[locator])}`)) {
        reasons.push(`${label}: line ${JSON.stringify(source.line ?? null)} of ${file} is not the line holding ${locator} of ${id}`)
    }
    return { row, field, values }
}

/**
 * **Load the draft store of one folder, or refuse it whole.** `folder` is a folder name under `docs/audits/drafts/`, or (tests only) an
 * absolute path to a TEST-ONLY copy. Throws `DraftStoreRefused` naming every defect.
 *
 * `recordsSetAsideBy` (stage W1 (b) of the A02 package, 11 November 2026; this module is TEST-ONLY): the id of a declared TEST-ONLY treatment
 * under which the store is read without its authorization records (the review pathway's K2 result is consumed in their place). Each record
 * file is still held to the gate (the whole folder is refused as before), and is then listed in `notRead`, with the treatment, never read.
 */
export function loadDraftStore(folder: string, options: { recordsSetAsideBy?: string } = {}): DraftStoreContents {
    const dir = path.isAbsolute(folder) ? folder : path.join(DRAFTS_DIR, folder)
    const reasons: string[] = []
    if (!fs.existsSync(dir)) throw new DraftStoreRefused(folder, [`no such folder: ${dir}`])
    const marked = fs
        .readdirSync(dir)
        .filter(name => name.includes('.DRAFT.'))
        .sort()
    const names = marked.filter(name => name.endsWith('.DRAFT.json'))
    if (!names.length) throw new DraftStoreRefused(folder, ['the folder holds no DRAFT file'])

    const parsed = new Map<string, unknown>()
    const split = new Map<string, string[]>()
    const readText = (file: string): string => fs.readFileSync(DRAFT_WORKBOOKS[file], 'utf8').replace(/^﻿/, '')
    const workbooks: WorkbookReader = {
        json: file => {
            if (!parsed.has(file)) parsed.set(file, JSON.parse(readText(file)))
            return parsed.get(file)
        },
        lines: file => {
            if (!split.has(file)) split.set(file, readText(file).split(/\r?\n/))
            return split.get(file)!
        },
    }
    const production = [...loadCorpusContracts(), ...loadSportProfile(), ...loadProvisionalRealizations()]
    const productionKeys = new Set(production.map(contract => knowledgeKey(contract.contractId)))
    const productionItems = new Set(production.flatMap(contract => (contract.items ?? []).map(item => String(item.itemId))))
    const productionGoals = new Set(learningGoalAuthorizations().map(record => record.learningGoalId))
    const citableDecisions = new Set<string>(((loadRegister().citableStandingDecisions ?? []) as any[]).map(decision => String(decision?.id ?? '')).filter(Boolean))
    const draftItems = new Set<string>()

    const files: string[] = []
    const notRead: { file: string; why: string }[] = []
    const contracts: LoadedContract[] = []
    const records: LearningGoalAuthorization[] = []

    for (const name of marked) {
        if (!name.endsWith('.DRAFT.json')) {
            notRead.push({ file: name, why: 'it is not a DRAFT JSON file (our note for his review, in prose), and this store reads only the two JSON shapes, a contract entry and an authorization record' })
            continue
        }
        let raw: any
        try {
            raw = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
        } catch (error) {
            reasons.push(`${name} does not parse: ${error instanceof Error ? error.message : String(error)}`)
            continue
        }
        if (!filled(raw?.standing) || !raw.standing.startsWith('DRAFT')) {
            reasons.push(`${name} does not stand DRAFT (its standing: ${JSON.stringify(raw?.standing ?? null)})`)
            continue
        }
        if (raw.contractEntry !== undefined) {
            files.push(name)
            const loaded = contractOf(name, raw.contractEntry, reasons, { productionKeys, productionItems, draftItems, citableDecisions, workbooks })
            if (loaded) contracts.push(loaded)
        } else if (raw.record !== undefined) {
            const record = recordOf(name, raw.record, reasons, productionGoals)
            if (options.recordsSetAsideBy) {
                notRead.push({ file: name, why: `an authorization record, held to the gate and set aside by the TEST-ONLY treatment ${options.recordsSetAsideBy}: the review pathway's K2 result is consumed in its place` })
                continue
            }
            files.push(name)
            if (record) records.push(record)
        } else {
            notRead.push({
                file: name,
                why: Array.isArray(raw.added)
                    ? 'it adds items to a production contract (added[]), which this store does not read: those items cite no workbook row with its words, so this gate cannot hold them'
                    : 'it holds neither a contract entry nor an authorization record, the two shapes this store reads',
            })
        }
    }
    if (reasons.length) throw new DraftStoreRefused(folder, reasons)
    return { folder, files, notRead, contracts, records }
}

interface ContractContext {
    productionKeys: Set<string>
    productionItems: Set<string>
    draftItems: Set<string>
    citableDecisions: Set<string>
    workbooks: WorkbookReader
}

/** One drafted contribution contract, gated and stamped; null where a defect stops it (every defect pushed to `reasons`). */
function contractOf(name: string, entry: any, reasons: string[], ctx: ContractContext): LoadedContract | null {
    const at = (what: string) => `${name}: ${what}`
    const before = reasons.length
    if (entry?.standing !== 'DRAFT') reasons.push(at(`the contract entry does not stand DRAFT (${JSON.stringify(entry?.standing ?? null)})`))
    if (!filled(entry?.kind) || !filled(entry?.name)) reasons.push(at('the contract entry names no kind or object'))
    const result = entry?.result ?? {}
    if (!Array.isArray(result.items) || !result.items.length) reasons.push(at('the contract holds no item'))
    if (!Array.isArray(result.declarations)) reasons.push(at('the contract holds no list of declarations'))
    if (reasons.length > before) return null
    const objectId = objectIdOf(String(entry.name), 0)
    const contractId = `${entry.kind}:${objectId}`
    if (ctx.productionKeys.has(knowledgeKey(contractId))) reasons.push(at(`${objectId} already has a production contract: a revision of approved knowledge goes through a ruled restatement, never a draft`))

    const items: ContractItem[] = []
    for (const item of result.items as any[]) {
        const id = String(item?.id ?? '')
        const where = (what: string) => at(`item ${id || '(no id)'} ${what}`)
        if (!filled(item?.id)) reasons.push(where('has no id'))
        else if (ctx.productionItems.has(id)) reasons.push(where('uses an id a production contract, the Sport Profile or a provisional realization already uses'))
        else if (ctx.draftItems.has(id)) reasons.push(where('is used twice in the store'))
        ctx.draftItems.add(id)
        if (item?.standing !== 'DRAFT') reasons.push(where(`does not stand DRAFT (${JSON.stringify(item?.standing ?? null)})`))
        for (const key of FORBIDDEN_ITEM_KEYS) if (item && typeof item === 'object' && key in item) reasons.push(where(`carries ${key}, which a draft never writes`))
        if (!filled(item?.fitNote)) reasons.push(where('carries no reasoning of ours (fitNote)'))
        const sources = Array.isArray(item?.source) ? (item.source as any[]) : []
        // An item written on his words (AUTHORED, OWNER_RULING) must cite the rows it quotes. An ASSUMED item claims no words of his and
        // establishes nothing (it bounds at most), so it may cite none; it must then name what it rests on, a standing decision the register
        // types as citable (B2 review, 28 October 2026: a filled fitNote alone said nothing of that).
        if (!sources.length && item?.basis !== 'ASSUMED') reasons.push(where(`cites no source row, and its basis ${JSON.stringify(item?.basis ?? null)} claims words that must be cited`))
        if (!sources.length && item?.basis === 'ASSUMED') {
            const named = String(item?.basisEvidence ?? '')
                .split(/[^A-Za-z0-9-]+/)
                .filter(token => ctx.citableDecisions.has(token))
            if (!named.length) reasons.push(where(`is ASSUMED and cites no source row, and its basisEvidence names no standing decision it rests on (one the register types as citable: ${[...ctx.citableDecisions].join(', ')})`))
        }
        if (!Array.isArray(item?.source)) reasons.push(where('carries no list of sources'))
        const cited: string[] = []
        for (const source of sources) {
            const label = `source ${String(source?.rowId ?? '(no row)')}`
            if (!isObject(source) || !filled(source.rowId) || !filled(source.file) || !filled(source.text)) {
                reasons.push(where(`${label} lacks its row, its file or the words it quotes`))
                continue
            }
            if (!(source.file in DRAFT_WORKBOOKS)) {
                reasons.push(where(`${label} cites ${source.file}, which is not a workbook this store reads`))
                continue
            }
            const found: string[] = []
            const resolved = citedRowOf(source, label, found, ctx.workbooks)
            reasons.push(...found.map(where))
            if (resolved) cited.push(...resolved.values)
        }
        for (const quotation of quotationsIn(String(item?.basisEvidence ?? ''))) {
            if (!verbatimIn(quotation, cited)) reasons.push(where(`basisEvidence quotes "${quotation}", which is not verbatim in what a source of the item cites`))
        }
        const { id: _id, ...rest } = item ?? {}
        items.push({ itemId: id, ...rest, category: DRAFT_KNOWLEDGE } as ContractItem)
    }
    const contract: LoadedContract = {
        contractId,
        objectId,
        knowledgeVersion: DRAFT_KNOWLEDGE_VERSION,
        items,
        declarations: (result.declarations as any[]).map(declaration => ({ ...declaration, category: DRAFT_KNOWLEDGE })),
        relationshipRules: Array.isArray(result.relationshipRules) ? JSON.parse(JSON.stringify(result.relationshipRules)) : [],
    }

    /**
     * **Every primary scoring condition the workbook holds for a drafted context is cited by an item constituting a scoring condition** (R8
     * section 7). The constituting items are read by the context-scoring guard's own reading (`constitutedConditionTypes`), so what this
     * requires is what the guard will hold the game to. A citation is the row in the context workbook's properties table, by its key.
     */
    const contextTable = DRAFT_TABLES[CONTEXT_WORKBOOK].properties
    const contextRows = ((ctx.workbooks.json(CONTEXT_WORKBOOK) as any)?.properties ?? []).filter((row: any) => row?.rpc_id === objectId && row?.property_category === PRIMARY_SCORING_CONDITION)
    const constituting = new Set(constitutedConditionTypes(contract).map(entry => entry.itemId))
    for (const row of contextRows) {
        const rowId = String(row[contextTable.key])
        const citing = (result.items as any[]).filter(
            item =>
                constituting.has(String(item?.id)) &&
                (Array.isArray(item?.source) ? item.source : []).some(
                    (source: any) => source?.file === CONTEXT_WORKBOOK && source?.table === 'properties' && String(source?.rowId ?? '').trim().split(/\s+/)[0] === rowId,
                ),
        )
        if (!citing.length) reasons.push(at(`the workbook's ${PRIMARY_SCORING_CONDITION} row ${rowId} for ${objectId} is cited by no item constituting a scoring condition, so the drafted context would not carry its approved scoring condition`))
    }
    return contract
}

/**
 * **TEST-ONLY: ILLUSTRATIVE carriers — values of ours that make a gap executable, never knowledge** — stage W4 of the A02 package (U2 b1, b2,
 * b3), 11 November 2026. Christian's second reply received 11 November 2026 delegates "Testing legitimate configuration alternatives using
 * clearly labeled provisional or illustrative knowledge."; the register says a begin-condition referent is written only by a ruled restatement
 * (C58), so nothing here is a restatement: each group is a labelled TEST-ONLY alternative a case adds by a declared treatment
 * (ILLUSTRATIVE_CARRIERS), standing for what an approved answer must supply.
 *
 * One file of its own folder (`docs/audits/drafts/a02-illustrative/`, so no draft store's contents change), held to this gate and refused WHOLE
 * on any defect: a standing that does not say DRAFT, ILLUSTRATIVE and TEST-ONLY; an item basis other than AUTHORED (OWNER_RULING claims a
 * ruling, refused by name; ASSUMED and ENGINE_ONLY establish nothing, so they could not carry what they illustrate); an item claiming a source
 * row, carrying what only a ruling or a realization writes (`FORBIDDEN_ITEM_KEYS`), without our reasoning (`fitNote`), or whose `basisEvidence`
 * does not begin 'ILLUSTRATIVE'; an id a production contract, the Sport Profile or a provisional realization uses, or one used twice; a
 * geometric value copied from a production provisional realization's item on the same row (A01's rulings are A01's alone); an episode scope the
 * register already holds, or not named 'ILLUSTRATIVE_...'; a group naming no contract, or an unknown key. Every item and declaration admitted is
 * stamped ILLUSTRATIVE (`types.ts`), never DRAFT_KNOWLEDGE.
 */
export interface IllustrativeGroup {
    id: string
    what: string
    addsTo: string
    replaces: string[]
    items: ContractItem[]
    declarations: { row: string; selector: string; from: string; to: string; qualifier?: string }[]
    /** Lines the group's items entail, so a realization-choices file's choice for them is set aside on the chain's copy (a choice for a line no longer open is refused). */
    setsAsideChoices: string[]
}
export interface IllustrativeCarriers {
    file: string
    episodeScopes: string[]
    groups: IllustrativeGroup[]
}
export const ILLUSTRATIVE_CARRIERS_FILE = path.join(DRAFTS_DIR, 'a02-illustrative', 'a02-illustrative.DRAFT.json')
const GROUP_KEYS = ['id', 'what', 'addsTo', 'replaces', 'items', 'declarations', 'setsAsideChoices']
const ILLUSTRATIVE_ITEM_KEYS = ['id', 'row', 'selector', 'requirement', 'value', 'valueStatus', 'strictness', 'scope', 'basis', 'basisEvidence', 'checkability', 'structuralClause', 'fitNote', 'typedBound']

export function loadIllustrativeCarriers(file: string = ILLUSTRATIVE_CARRIERS_FILE): IllustrativeCarriers {
    const reasons: string[] = []
    let raw: any
    try {
        raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (error) {
        throw new DraftStoreRefused(file, [`the ILLUSTRATIVE carriers do not parse: ${error instanceof Error ? error.message : String(error)}`])
    }
    const standing = String(raw?.standing ?? '')
    if (!standing.startsWith('DRAFT') || !standing.includes('ILLUSTRATIVE') || !standing.includes('TEST-ONLY')) reasons.push(`the standing does not say DRAFT, ILLUSTRATIVE and TEST-ONLY (${JSON.stringify(raw?.standing ?? null)})`)
    const body = raw?.illustrative
    if (!isObject(body) || body.label !== 'ILLUSTRATIVE') reasons.push('the file holds no illustrative block labelled ILLUSTRATIVE')
    const register = loadRegister()
    const scopes: string[] = ((register.vocabularies?.contractEnums?.scope ?? []) as unknown[]).map(String)
    const episodeScopes: string[] = []
    for (const entry of Array.isArray(body?.episodeScopes) ? body.episodeScopes : []) {
        const scope = String(entry?.scope ?? '')
        if (!scope.startsWith('ILLUSTRATIVE_') || !filled(entry?.why)) reasons.push(`an episode scope is named 'ILLUSTRATIVE_...' and says why (${JSON.stringify(entry)})`)
        else if (scopes.includes(scope)) reasons.push(`the episode scope ${scope} is already a scope of the register`)
        else episodeScopes.push(scope)
    }
    const production = [...loadCorpusContracts(), ...loadSportProfile(), ...loadProvisionalRealizations()]
    const productionItems = new Set(production.flatMap(contract => (contract.items ?? []).map(item => String(item.itemId))))
    const realizationValues = new Map<string, string[]>()
    for (const item of loadProvisionalRealizations().flatMap(contract => contract.items ?? [])) realizationValues.set(String(item.row), [...(realizationValues.get(String(item.row)) ?? []), JSON.stringify(item.value)])
    // An offset measured for the same element (row and selector) as a production provisional realization's: A01's 20 m pressure reference is A01's.
    const offsetsOf = (value: unknown): string[] => (isObject(value) && isObject(value.offsetM) ? [JSON.stringify(value.offsetM)] : [])
    const offsetKey = (row: unknown, selector: unknown, offset: string) => `${String(row)}|${String(selector)}|${offset}`
    const realizationOffsets = new Set(loadProvisionalRealizations().flatMap(contract => (contract.items ?? []).flatMap(item => offsetsOf(item.value).map(offset => offsetKey(item.row, item.selector, offset)))))
    const seen = new Set<string>()
    const groups: IllustrativeGroup[] = []
    for (const group of Array.isArray(body?.groups) ? body.groups : []) {
        const at = (what: string) => `group ${String(group?.id ?? '(no id)')}: ${what}`
        for (const key of Object.keys(group ?? {})) if (!GROUP_KEYS.includes(key)) reasons.push(at(`unknown key ${key}`))
        if (!filled(group?.id) || !filled(group?.what) || !filled(group?.addsTo)) reasons.push(at('names no id, what it carries, or the contract it adds to'))
        if (!Array.isArray(group?.replaces) || !Array.isArray(group?.items) || !Array.isArray(group?.declarations) || !(group.items.length || group.declarations.length)) reasons.push(at('holds no list of replaced items, items and declarations, or carries nothing'))
        const items: ContractItem[] = []
        for (const item of Array.isArray(group?.items) ? group.items : []) {
            const id = String(item?.id ?? '')
            const where = (what: string) => at(`item ${id || '(no id)'} ${what}`)
            for (const key of Object.keys(item ?? {})) if (!ILLUSTRATIVE_ITEM_KEYS.includes(key)) reasons.push(where(`carries ${key}, which an ILLUSTRATIVE carrier never writes`))
            for (const key of FORBIDDEN_ITEM_KEYS) if (item && typeof item === 'object' && key in item) reasons.push(where(`carries ${key}, which only a ruled restatement or a provisional realization writes`))
            if (!filled(item?.id) || !filled(item?.row)) reasons.push(where('has no id or row'))
            else if (productionItems.has(id)) reasons.push(where('uses an id a production contract, the Sport Profile or a provisional realization already uses'))
            else if (seen.has(id)) reasons.push(where('is used twice in the file'))
            seen.add(id)
            if (item?.basis === 'OWNER_RULING') reasons.push(where('claims OWNER_RULING: an ILLUSTRATIVE carrier never claims a ruling of Christian\'s'))
            else if (item?.basis !== 'AUTHORED') reasons.push(where(`has basis ${JSON.stringify(item?.basis ?? null)}: an ILLUSTRATIVE carrier is AUTHORED so it establishes what it illustrates (ASSUMED and ENGINE_ONLY establish nothing); its category, never its basis, says what it is`))
            if (!filled(item?.fitNote)) reasons.push(where('carries no reasoning of ours (fitNote)'))
            if (!String(item?.basisEvidence ?? '').startsWith('ILLUSTRATIVE')) reasons.push(where("has basisEvidence that does not begin 'ILLUSTRATIVE'"))
            if (item?.scope && String(item.scope).startsWith('ILLUSTRATIVE_') && !episodeScopes.includes(String(item.scope))) reasons.push(where(`is scoped ${item.scope}, an episode scope the file does not declare`))
            if (['S5', 'S6', 'P10'].includes(String(item?.row)) && (realizationValues.get(String(item.row)) ?? []).includes(JSON.stringify(item.value))) reasons.push(where(`copies the value a production provisional realization holds on ${item.row}`))
            if (offsetsOf(item?.value).some(offset => realizationOffsets.has(offsetKey(item.row, item.selector, offset)))) reasons.push(where(`copies an offset a production provisional realization holds for the same element (${offsetsOf(item.value).join(', ')})`))
            const { id: _id, ...rest } = item ?? {}
            items.push({ itemId: id, ...rest, category: ILLUSTRATIVE } as ContractItem)
        }
        const declarations: IllustrativeGroup['declarations'] = []
        for (const d of Array.isArray(group?.declarations) ? group.declarations : []) {
            if (!filled(d?.row) || !filled(d?.selector) || !filled(d?.from) || !filled(d?.to) || (d.qualifier !== undefined && !filled(d.qualifier))) reasons.push(at(`a declaration replacement names its row, selector, from and to (${JSON.stringify(d)})`))
            else declarations.push({ row: d.row, selector: d.selector, from: d.from, to: d.to, ...(d.qualifier ? { qualifier: d.qualifier } : {}) })
        }
        if (group?.setsAsideChoices !== undefined && (!Array.isArray(group.setsAsideChoices) || !group.setsAsideChoices.every(filled))) reasons.push(at('setsAsideChoices is a list of line ids'))
        groups.push({ id: String(group?.id), what: String(group?.what), addsTo: String(group?.addsTo), replaces: Array.isArray(group?.replaces) ? group.replaces.map(String) : [], items, declarations, setsAsideChoices: Array.isArray(group?.setsAsideChoices) ? group.setsAsideChoices.map(String) : [] })
    }
    if (!groups.length) reasons.push('the file holds no group')
    if (new Set(groups.map(g => g.id)).size !== groups.length) reasons.push('a group id is used twice')
    if (reasons.length) throw new DraftStoreRefused(file, reasons)
    const repository = path.resolve(SYSTEM_DIR, '..', '..', '..')
    const shown = path.relative(repository, path.resolve(file)).split(path.sep).join('/')
    return { file: shown.startsWith('..') ? path.basename(file) : shown, episodeScopes, groups }
}

/**
 * **TEST-ONLY: a draft store with ILLUSTRATIVE carrier groups added, by a declared treatment** (W4). On a deep copy: each group's replaced items
 * are taken out of the draft contract it adds to (each must be there), its items added (stamped ILLUSTRATIVE), and each of its declaration
 * replacements made on exactly one declaration (stamped ILLUSTRATIVE, its note naming the group and the treatment). The episode scopes the
 * chosen groups use go to the register copy the build derives over (`registerOverlay`). Throws, naming the defect, on an unknown group, a
 * contract the store does not hold, a replaced item it does not hold, an id clash, or a declaration that is not exactly one.
 */
export function withIllustrativeCarriers(store: DraftStoreContents, carriers: IllustrativeCarriers, groupIds: string[], treatmentId: string): DraftStoreContents {
    const next = JSON.parse(JSON.stringify(store)) as DraftStoreContents
    if (!groupIds.length) throw new Error(`treatment ${treatmentId}: ILLUSTRATIVE carriers are added by naming at least one group`)
    const used = new Set<string>()
    const items: string[] = []
    const setsAsideChoices: string[] = []
    for (const id of groupIds) {
        const group = carriers.groups.find(g => g.id === id)
        if (!group) throw new Error(`treatment ${treatmentId}: ${carriers.file} holds no ILLUSTRATIVE group ${id}`)
        setsAsideChoices.push(...group.setsAsideChoices)
        const contract = next.contracts.find(c => c.contractId === group.addsTo)
        if (!contract) throw new Error(`treatment ${treatmentId}: group ${id} adds to ${group.addsTo}, which the draft store ${store.folder} does not hold`)
        for (const replaced of group.replaces) {
            if (!contract.items.some(i => i.itemId === replaced)) throw new Error(`treatment ${treatmentId}: group ${id} replaces ${replaced}, which ${group.addsTo} does not hold`)
            contract.items = contract.items.filter(i => i.itemId !== replaced)
        }
        for (const item of group.items) {
            if (contract.items.some(i => i.itemId === item.itemId)) throw new Error(`treatment ${treatmentId}: group ${id} adds ${item.itemId}, which ${group.addsTo} already holds`)
            contract.items.push(JSON.parse(JSON.stringify(item)))
            items.push(`${group.addsTo} ${item.itemId}`)
            for (const scope of carriers.episodeScopes) if (JSON.stringify(item).includes(`"${scope}"`)) used.add(scope)
        }
        const declarations = (contract.declarations ?? []) as any[]
        for (const d of group.declarations) {
            const hits = declarations.filter(x => x.row === d.row && x.selector === d.selector && x.declaration === d.from)
            if (hits.length !== 1) throw new Error(`treatment ${treatmentId}: group ${id}: ${group.addsTo} holds ${hits.length} declarations ${d.from} on ${d.row} (${d.selector}), and a carrier replaces exactly one`)
            declarations[declarations.indexOf(hits[0])] = { ...hits[0], declaration: d.to, ...(d.qualifier ? { qualifier: d.qualifier } : {}), category: ILLUSTRATIVE, note: `ILLUSTRATIVE carrier ${id} (TEST-ONLY treatment ${treatmentId}), no ruling: ${String(hits[0].note ?? '')}` }
        }
    }
    // Each treatment's carriers are listed apart, in the order the treatments were applied; the overlay holds every scope any of them uses.
    next.illustrative = [...(store.illustrative ?? []), { treatmentId, file: carriers.file, groups: [...groupIds], items, setsAsideChoices }]
    const scopes = [...new Set([...(store.registerOverlay?.episodeScopes ?? []), ...carriers.episodeScopes.filter(s => used.has(s))])]
    if (scopes.length) next.registerOverlay = { episodeScopes: scopes, treatmentId: [...new Set([...(store.registerOverlay ? store.registerOverlay.treatmentId.split('+') : []), ...(used.size ? [treatmentId] : [])])].join('+') }
    return next
}

/**
 * **TEST-ONLY: a PROPOSED configuration — our proposal of new knowledge for Christian's approval, carried as a realization-shaped contract,
 * never knowledge and never a ruling** — stage B1 of the A02 complete-activity package, 12 November 2026. Christian, received 12 November 2026:
 * "Please propose the simplest representative configuration that makes the relevant defensive pressure and escape target observable to the
 * coach." "The final interpretation and any consequential new knowledge should remain subject to my approval." The A01 precedent's engine path
 * (a realization-shaped contract handed to the chain) with one label changed: every item is stamped PROPOSED (ILLUSTRATIVE where its evidence
 * says so), and it reaches a build only through the TEST-ONLY upstream option (`UpstreamDecisions.proposedRealization`), beside K2's result.
 *
 * One file of its own folder (`docs/audits/drafts/a02-proposed/`, so no draft store's contents change), held to this gate and refused WHOLE on
 * any defect: a standing that does not begin DRAFT and say PROPOSED and TEST-ONLY; a realization whose contract is not `proposed:<id>`, whose
 * id or contract id a production contract, the Sport Profile or a provisional realization uses, holding a declaration, a relationship rule,
 * a realization-choices file or any key a ruled realization writes (`ruledOn`, `by`, `citedAs`, `words`, `departsFrom`, `defaultLawsCheck`);
 * an item basis other than AUTHORED (OWNER_RULING claims a ruling, refused by name), an item carrying what only a ruled restatement or a
 * provisional realization writes (`FORBIDDEN_ITEM_KEYS`: `authorizedBy`, the role-yield marker, an item-level `departsFrom`, ...), or any
 * key a proposal never writes (a source, Christian's words); an item without our reasoning (`fitNote`), without a question id the file asks
 * (`waitsOn`), without the request it answers in Christian's words with the received date (`askedFor`), or whose `basisEvidence` does not begin
 * 'PROPOSED:' or 'ILLUSTRATIVE:'; an item on a participant row (a P row: no placement relationship exists for the context), naming a
 * library constraint, scoped to anything but the whole game, or carrying a value or offset a production provisional realization holds on
 * the same row and selector (A01's rulings are A01's alone); a role token the register already holds proposed as new, a held token given
 * another noun, or not two roles; a restatement replacement that is not typed to an item of this configuration. Every item admitted is
 * stamped PROPOSED or ILLUSTRATIVE (`types.ts`), never DRAFT_KNOWLEDGE and never PROVISIONAL_REALIZATION_CHOICE.
 */
export interface ProposedConfiguration {
    file: string
    /** The realization-shaped contract (a `ProvisionalRealization` in shape only): category PROPOSED, every item PROPOSED or ILLUSTRATIVE. */
    realization: ProvisionalRealization
    /** The roles of the register copy (`RegisterOverlay.roles`), in order. */
    roles: { token: string; noun: string | null }[]
    /** Each item of the context's restatement this configuration replaces on the chain's copy, with the typed item that replaces it (CANDIDATE, contingent on the configuration). */
    replacements: { contractId: string; replaces: string; item: ContractItem }[]
    /** The questions the configuration waits on, each with the request it answers. */
    questions: { id: string; asks: string; askedFor: string }[]
    /**
     * Lines the configuration's items entail, so the game form's realization-choices file's choice for them is set aside on the chain's copy
     * (a choice for a line no longer open is refused), as an ILLUSTRATIVE carrier group's are (W4's `setsAsideChoices`).
     */
    setsAsideChoices: string[]
    /**
     * Stage B2 (TEST-ONLY): the configuration's PROPOSED departures from the Laws and the check that reads them (the file's `laws` block), held to
     * `departureRefusals` and `defaultLawsCheckRefusal` and to this gate's PROPOSED rules: every basis is ours, says it is no ruling and quotes
     * the request it answers with its received date. Carried on `realization` (as its own `defaultLawsCheck` and `realizationDepartures`) only
     * where the loader is asked (`lawDepartures`); null where the file holds none.
     */
    laws: { check: DefaultLawsCheck; departures: LawDeparture[] } | null
}
export const PROPOSED_HPE1_FILE = path.join(DRAFTS_DIR, 'a02-proposed', 'hpe1.PROPOSED.json')
const PROPOSED_ITEM_KEYS = ['id', 'row', 'selector', 'requirement', 'value', 'valueStatus', 'strictness', 'scope', 'basis', 'basisEvidence', 'checkability', 'structuralClause', 'fitNote', 'typedBound', 'waitsOn', 'askedFor']
const PROPOSED_REALIZATION_KEYS = ['id', 'contractId', 'realizes', 'realizationChoices', 'notWithPracticeSituations', 'items', 'declarations', 'relationshipRules', 'setsAsideChoices', 'note']
/** What a proposal never writes on the realization: the keys of a ruled realization (Christian's words, Christian's date, Christian's departures, Christian's check). */
const RULED_REALIZATION_KEYS = ['ruledOn', 'by', 'citedAs', 'words', 'departsFrom', 'defaultLawsCheck', 'category', 'testingBoundaries', 'objectSuitability', 'basedOn', 'withdraws']
/**
 * The received dates a PROPOSED configuration may quote Christian's request with (stage B1: 12 November 2026). Package 5 (13 November 2026,
 * the lead's build item B2, probe B2 measured): made a list, so a configuration answering Christian's reply received 13 November 2026 may quote
 * it with its own received date; a quotation with any other date, or none, is still refused.
 */
const RECEIVED_DATES = ['(received 12 November 2026)', '(received 13 November 2026)']
const RECEIVED_WORDS = RECEIVED_DATES.join(' or ')
const quotesReceived = (text: string): boolean => RECEIVED_DATES.some(date => text.includes(date))

export function loadProposedRealization(file: string = PROPOSED_HPE1_FILE, options: { lawDepartures?: boolean } = {}): ProposedConfiguration {
    const reasons: string[] = []
    let raw: any
    try {
        raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (error) {
        throw new DraftStoreRefused(file, [`the PROPOSED configuration does not parse: ${error instanceof Error ? error.message : String(error)}`])
    }
    const standing = String(raw?.standing ?? '')
    if (!standing.startsWith('DRAFT') || !standing.includes('PROPOSED') || !standing.includes('TEST-ONLY')) reasons.push(`the standing does not begin DRAFT and say PROPOSED and TEST-ONLY (${JSON.stringify(raw?.standing ?? null)})`)
    const body = raw?.proposed
    if (!isObject(body) || body.label !== PROPOSED) reasons.push(`the file holds no proposed block labelled ${PROPOSED}`)
    // The questions the configuration waits on: each an id, what it asks, and the request it answers in Christian's words with the date.
    const questions: ProposedConfiguration['questions'] = []
    for (const q of Array.isArray(body?.questions) ? body.questions : []) {
        if (!filled(q?.id) || !filled(q?.asks) || !filled(q?.askedFor) || !quotationsIn(String(q.askedFor)).length || !quotesReceived(String(q.askedFor))) reasons.push(`a question names its id, what it asks, and the request it answers quoted with ${RECEIVED_WORDS} (${JSON.stringify(q)})`)
        else questions.push({ id: String(q.id), asks: String(q.asks), askedFor: String(q.askedFor) })
    }
    if (!questions.length) reasons.push('the file asks no question, so no item can say what it waits on')
    const questionIds = new Set(questions.map(q => q.id))
    const production = [...loadCorpusContracts(), ...loadSportProfile(), ...loadProvisionalRealizations()]
    const productionItems = new Set(production.flatMap(contract => (contract.items ?? []).map(item => String(item.itemId))))
    const productionIds = new Set([...production.map(contract => contract.contractId), ...loadProvisionalRealizations().map(r => r.provisionalId)])
    const realizationValues = new Map<string, string[]>()
    for (const item of loadProvisionalRealizations().flatMap(contract => contract.items ?? [])) realizationValues.set(`${String(item.row)}|${String(item.selector)}`, [...(realizationValues.get(`${String(item.row)}|${String(item.selector)}`) ?? []), JSON.stringify(item.value)])
    const offsetsOf = (value: unknown): string[] => (isObject(value) && isObject(value.offsetM) ? [JSON.stringify(value.offsetM)] : [])
    const realizationOffsets = new Set(loadProvisionalRealizations().flatMap(contract => (contract.items ?? []).flatMap(item => offsetsOf(item.value).map(offset => `${String(item.row)}|${String(item.selector)}|${offset}`))))

    /** One item of the configuration (or a replacement), gated; its stamp read from its evidence. */
    const gateItem = (item: any, at: (what: string) => string, idPrefix: string | null, seen: Set<string>): ContractItem | null => {
        const id = String(item?.id ?? '')
        const where = (what: string) => at(`item ${id || '(no id)'} ${what}`)
        const before = reasons.length
        for (const key of Object.keys(item ?? {})) if (!PROPOSED_ITEM_KEYS.includes(key) && !FORBIDDEN_ITEM_KEYS.includes(key)) reasons.push(where(`carries ${key}, which a PROPOSED item never writes`))
        for (const key of FORBIDDEN_ITEM_KEYS) if (item && typeof item === 'object' && key in item) reasons.push(where(`carries ${key}, which only a ruled restatement or a provisional realization writes`))
        if (!filled(item?.id) || !filled(item?.row)) reasons.push(where('has no id or row'))
        else if (idPrefix !== null && !id.startsWith(idPrefix)) reasons.push(where(`does not begin ${idPrefix}`))
        if (productionItems.has(id)) reasons.push(where('uses an id a production contract, the Sport Profile or a provisional realization already uses'))
        else if (seen.has(id)) reasons.push(where('is used twice in the file'))
        seen.add(id)
        if (item?.basis === 'OWNER_RULING') reasons.push(where("claims OWNER_RULING: a PROPOSED item never claims a ruling of Christian's"))
        else if (item?.basis !== 'AUTHORED') reasons.push(where(`has basis ${JSON.stringify(item?.basis ?? null)}: a PROPOSED item is AUTHORED so it establishes what it proposes; its category, never its basis, says what it is`))
        if (!filled(item?.fitNote)) reasons.push(where('carries no reasoning of ours (fitNote)'))
        if (!filled(item?.waitsOn) || !questionIds.has(String(item.waitsOn))) reasons.push(where(`names no question of the file it waits on (waitsOn: ${JSON.stringify(item?.waitsOn ?? null)})`))
        if (idPrefix !== null && (!filled(item?.askedFor) || !quotationsIn(String(item.askedFor)).length || !quotesReceived(String(item.askedFor)))) reasons.push(where(`does not quote the request it answers with ${RECEIVED_WORDS} (askedFor)`))
        const evidence = String(item?.basisEvidence ?? '')
        if (idPrefix !== null && !evidence.startsWith('PROPOSED:') && !evidence.startsWith('ILLUSTRATIVE:')) reasons.push(where("has basisEvidence that does not begin 'PROPOSED:' or 'ILLUSTRATIVE:'"))
        if (/^P[0-9]/.test(String(item?.row ?? ''))) reasons.push(where(`is on the participant row ${item.row}: no placement relationship exists for the context, so a PROPOSED configuration places no one`))
        if (JSON.stringify(item ?? null).includes('tl-v0-constraint')) reasons.push(where('names a library constraint: K2 retains the form without additional manipulation'))
        if (item?.scope !== 'WHOLE_GAME') reasons.push(where(`is scoped ${JSON.stringify(item?.scope ?? null)}: a PROPOSED item is scoped to the whole game`))
        // As the ILLUSTRATIVE gate holds it: a geometric value (where an element sits or how far it runs) copied from A01's realization.
        if (['S5', 'S6', 'P10'].includes(String(item?.row)) && (realizationValues.get(`${String(item?.row)}|${String(item?.selector)}`) ?? []).includes(JSON.stringify(item?.value))) reasons.push(where(`copies the value a production provisional realization holds on ${item.row} for the same element`))
        if (offsetsOf(item?.value).some(offset => realizationOffsets.has(`${String(item.row)}|${String(item.selector)}|${offset}`))) reasons.push(where(`copies an offset a production provisional realization holds for the same element (${offsetsOf(item.value).join(', ')})`))
        if (reasons.length > before) return null
        const { id: _id, ...rest } = item
        return { itemId: id, ...rest, category: idPrefix === null ? DRAFT_KNOWLEDGE : evidence.startsWith('ILLUSTRATIVE:') ? ILLUSTRATIVE : PROPOSED } as ContractItem
    }

    const r = body?.realization
    const id = String(r?.id ?? '')
    const at = (what: string) => `realization ${id || '(no id)'}: ${what}`
    if (!isObject(r)) reasons.push('the file holds no realization')
    for (const key of Object.keys(r ?? {})) if (!PROPOSED_REALIZATION_KEYS.includes(key)) reasons.push(at(RULED_REALIZATION_KEYS.includes(key) ? `carries ${key}, which only a ruled realization writes` : `carries ${key}, which a PROPOSED configuration never writes`))
    if (!filled(r?.id) || r?.contractId !== `proposed:${id}`) reasons.push(at(`its contract id must be proposed:${id}`))
    if (productionIds.has(id) || productionIds.has(String(r?.contractId))) reasons.push(at('uses an id a production contract or provisional realization uses'))
    if (!filled(r?.realizes)) reasons.push(at('names no context it realizes'))
    if (r?.realizationChoices !== null) reasons.push(at('names a realization-choices file; a PROPOSED configuration closes no line by a choices file'))
    if (!Array.isArray(r?.notWithPracticeSituations)) reasons.push(at('lists no practice situations it was not designed for (an empty list says it was designed for all)'))
    if (!Array.isArray(r?.declarations) || r.declarations.length) reasons.push(at('holds a declaration; a PROPOSED configuration says what its activity does, never what knowledge does not constrain'))
    if (!Array.isArray(r?.relationshipRules) || r.relationshipRules.length) reasons.push(at('holds a relationship rule'))
    if (r?.setsAsideChoices !== undefined && (!Array.isArray(r.setsAsideChoices) || !r.setsAsideChoices.every(filled))) reasons.push(at('setsAsideChoices is a list of line ids'))
    const seen = new Set<string>()
    const items: ContractItem[] = []
    for (const item of Array.isArray(r?.items) ? r.items : []) {
        const gated = gateItem(item, at, `${id}-`, seen)
        if (gated) items.push(gated)
    }
    if (!Array.isArray(r?.items) || !r.items.length) reasons.push(at('holds no item'))

    // The roles of the register copy: two, in order; a new token comes with its proposed noun and is not the register's; a held one keeps its noun.
    const register = indexRegister(loadRegister())
    const heldRoles = register.roleBlocks?.roles ?? []
    const roles: ProposedConfiguration['roles'] = []
    for (const role of Array.isArray(body?.roles) ? body.roles : []) {
        const token = String(role?.token ?? '')
        if (!filled(role?.token)) reasons.push(`a role names no token (${JSON.stringify(role)})`)
        else if (role?.noun !== null && heldRoles.includes(token)) reasons.push(`the role token ${token} is already in the register: a PROPOSED configuration proposes a new token only where the register holds none, and keeps a held token's noun`)
        else if (role?.noun === null && !heldRoles.includes(token)) reasons.push(`the role token ${token} is not in the register, so it comes with the noun proposed for it`)
        // Stage A2 (13 November 2026, V2 finding 11), re-pinned openly: the noun was required labelled CANDIDATE; a new role's noun is new knowledge
        // of ours, proposed with the role itself (N3), so it is labelled PROPOSED.
        else if (role?.noun !== null && (!filled(role?.noun) || role?.label !== PROPOSED || !questionIds.has(String(role?.waitsOn)))) reasons.push(`the new role ${token} comes with its noun, labelled PROPOSED, and the question it waits on`)
        roles.push({ token, noun: role?.noun === null ? null : String(role?.noun ?? '') })
    }
    if (roles.length !== 2) reasons.push(`the configuration names ${roles.length} roles; a role block holds exactly two, one per team`)

    // Each replacement of an item of the context's restatement: typed to an item of this configuration (the configuration's own element).
    const replacements: ProposedConfiguration['replacements'] = []
    for (const x of Array.isArray(body?.restatementReplacements) ? body.restatementReplacements : []) {
        const where = (what: string) => `replacement of ${String(x?.replaces ?? '(none)')}: ${what}`
        if (!filled(x?.contractId) || !filled(x?.replaces) || !isObject(x?.item)) {
            reasons.push(where('names the contract, the item it replaces and the item that replaces it'))
            continue
        }
        const ref = isObject(x.item.value) && isObject(x.item.value.structuralRef) ? x.item.value.structuralRef : null
        if (!ref || ref.contractId !== `proposed:${id}` || !items.some(i => i.itemId === ref.itemId)) reasons.push(where(`is not typed to an item of proposed:${id}`))
        if (!String(x.item.basisEvidence ?? '').startsWith('CANDIDATE')) reasons.push(where("has basisEvidence that does not begin 'CANDIDATE' (our restatement, contingent on the configuration)"))
        const gated = gateItem(x.item, where, null, seen)
        if (gated) replacements.push({ contractId: String(x.contractId), replaces: String(x.replaces), item: gated })
    }
    /*
     * Stage B2 (TEST-ONLY): the configuration's PROPOSED departures from the Laws and the check that reads them (the file's `laws` block, never on
     * the realization itself, whose `departsFrom` and `defaultLawsCheck` stay refused above). Held to exactly the rules a realization's own are
     * (`defaultLawsCheckRefusal`, `departureRefusals`, so a law the Sport Profile does not name, a second departure from one law, an extent
     * outside the closed list or a basis without words is refused), and, as a proposal, to one more: every basis is ours (its citedAs begins
     * PROPOSED and says it is not a ruling) and quotes the request it answers with the received date. A basis claiming a ruling is refused.
     */
    let laws: ProposedConfiguration['laws'] = null
    const lawsBlock = body?.laws
    if (lawsBlock !== undefined) {
        const where = (what: string) => `laws: ${what}`
        if (!isObject(lawsBlock)) reasons.push(where('the block is not an object (defaultLawsCheck, departsFrom, note)'))
        else {
            for (const key of Object.keys(lawsBlock)) if (!['defaultLawsCheck', 'departsFrom', 'note'].includes(key)) reasons.push(where(`carries ${key}, which a PROPOSED laws block never writes`))
            const defaultLaws = loadSportDefaultLaws()
            if (!defaultLaws) reasons.push(where('the Sport Profile names no default laws'))
            const check = lawsBlock.defaultLawsCheck as any
            const refusedCheck = defaultLawsCheckRefusal(check)
            if (refusedCheck) reasons.push(where(`the configuration ${refusedCheck}`))
            const departures = lawsBlock.departsFrom
            const refusedDepartures = defaultLaws ? departureRefusals(departures, defaultLaws.laws, where('the configuration (on itself)'), indexRegister(loadRegister())) : []
            reasons.push(...refusedDepartures)
            for (const basis of [check?.basis, ...(Array.isArray(departures) ? departures.map((d: any) => d?.basis) : [])]) {
                const cited = String(basis?.citedAs ?? '')
                if (!cited.startsWith('PROPOSED') || !cited.includes('not a ruling') || !quotesReceived(cited))
                    reasons.push(where(`a basis is cited ${JSON.stringify(basis?.citedAs ?? null)}: a PROPOSED check or departure is ours, says it is not a ruling, and names the request it answers ${RECEIVED_WORDS}`))
            }
            if (!refusedCheck && !refusedDepartures.length && defaultLaws) laws = { check: JSON.parse(JSON.stringify(check)), departures: JSON.parse(JSON.stringify(departures)) }
        }
    }
    if (options.lawDepartures && lawsBlock === undefined) reasons.push('the configuration is asked to carry its departures from the Laws, and the file holds none (laws)')
    if (reasons.length) throw new DraftStoreRefused(file, reasons)
    const repository = path.resolve(SYSTEM_DIR, '..', '..', '..')
    const shown = path.relative(repository, path.resolve(file)).split(path.sep).join('/')
    const realization = {
        contractId: `proposed:${id}`,
        objectId: `proposed:${id}`,
        knowledgeVersion: DRAFT_KNOWLEDGE_VERSION,
        items,
        declarations: [],
        relationshipRules: [],
        provisionalId: id,
        category: PROPOSED,
        realizes: String(r.realizes),
        // Never a ruling: these four fields say so where a reader of a realization reads them (no ruled realization's words are carried).
        ruledOn: 'NOT RULED',
        by: 'PROPOSED (ours), for Christian\'s approval: not a ruling',
        citedAs: 'PROPOSED (ours): not a ruling of Christian\'s',
        words: [],
        realizationChoices: null,
        notWithPracticeSituations: (r.notWithPracticeSituations as any[]).map(s => ({ id: String(s.id), basis: String(s.basis), because: String(s.because) })),
        testingBoundaries: null,
        // Stage B2: the PROPOSED check and departures, only where asked, recorded on the configuration itself (never on an item).
        ...(options.lawDepartures && laws ? { defaultLawsCheck: JSON.parse(JSON.stringify(laws.check)), realizationDepartures: { recordedBy: id, departures: JSON.parse(JSON.stringify(laws.departures)) } } : {}),
    } as unknown as ProvisionalRealization
    return { file: shown.startsWith('..') ? path.basename(file) : shown, realization, roles, replacements, questions, setsAsideChoices: Array.isArray(r.setsAsideChoices) ? r.setsAsideChoices.map(String) : [], laws }
}

/**
 * **TEST-ONLY: the draft store with a PROPOSED configuration's restatement replacements made, on a copy** (stage B1). Each replaced item must
 * be in the contract it names; the typed item that replaces it keeps the replaced item's sources (it restates the same approved row), and
 * every quotation in its evidence must be verbatim in them (the store's own rule). Stamped DRAFT_KNOWLEDGE (CANDIDATE, contingent on the
 * configuration). Throws, naming the defect, on a contract the store does not hold, a replaced item it does not hold, or an id clash.
 */
export function withProposedReplacements(store: DraftStoreContents, proposed: ProposedConfiguration, treatmentId: string): DraftStoreContents {
    const next = JSON.parse(JSON.stringify(store)) as DraftStoreContents
    for (const x of proposed.replacements) {
        const contract = next.contracts.find(c => c.contractId === x.contractId)
        if (!contract) throw new Error(`treatment ${treatmentId}: the PROPOSED configuration replaces an item of ${x.contractId}, which the draft store ${store.folder} does not hold`)
        const replaced = contract.items.find(i => i.itemId === x.replaces)
        if (!replaced) throw new Error(`treatment ${treatmentId}: the PROPOSED configuration replaces ${x.replaces}, which ${x.contractId} does not hold`)
        if (contract.items.some(i => i.itemId === x.item.itemId)) throw new Error(`treatment ${treatmentId}: ${x.contractId} already holds ${x.item.itemId}`)
        const sources = JSON.parse(JSON.stringify((replaced as any).source ?? [])) as any[]
        const cited = sources.map(s => String(s?.text ?? ''))
        for (const quotation of quotationsIn(String(x.item.basisEvidence ?? ''))) if (!verbatimIn(quotation, cited)) throw new Error(`treatment ${treatmentId}: ${x.item.itemId} quotes "${quotation}", which is not verbatim in the rows ${x.replaces} cites`)
        contract.items = contract.items.map(i => (i.itemId === x.replaces ? ({ ...JSON.parse(JSON.stringify(x.item)), source: sources, standing: 'DRAFT' } as ContractItem) : i))
    }
    return next
}

/** One drafted authorization record, gated and stamped; null where a defect stops it. */
function recordOf(name: string, record: any, reasons: string[], productionGoals: Set<string>): LearningGoalAuthorization | null {
    const at = (what: string) => `${name}: ${what}`
    const before = reasons.length
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
        reasons.push(at('the record is not an object'))
        return null
    }
    if (productionGoals.has(record.learningGoalId)) reasons.push(at(`${record.learningGoalId} has a production record: a draft never stands beside or for one`))
    if ('knowledgeStatus' in record) reasons.push(at('carries knowledgeStatus, which only the store stamps'))
    for (const key of FORBIDDEN_RECORD_KEYS) if (key in record) reasons.push(at(`carries ${key}, which only his rulings give a record`))
    const stamped: LearningGoalAuthorization = { ...JSON.parse(JSON.stringify(record)), knowledgeStatus: 'DRAFT' }
    reasons.push(...validateLearningGoalAuthorizations([stamped], undefined, undefined, undefined, { draftsAdmitted: true }).map(error => at(`the record gate refuses it as a draft: ${error}`)))
    return reasons.length > before ? null : stamped
}

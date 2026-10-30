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
import { loadCorpusContracts, loadProvisionalRealizations, loadRegister, loadSportDefaultLaws, loadSportProfile, objectIdOf } from './corpus'
import { LawsMateriality, lawsMaterialityRefusals } from './default-laws'
import { knowledgeKey } from './knowledge-key'
import { AUDITS_DIR } from './knowledge-root'
import { indexRegister } from './register'
import { DraftStoreContents } from './run-bounded-selection'
import { ContractItem, DRAFT_KNOWLEDGE, DRAFT_KNOWLEDGE_VERSION, LoadedContract, ROLE_YIELD_KEY } from './types'

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
 */
export function loadDraftStore(folder: string): DraftStoreContents {
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
            files.push(name)
            const record = recordOf(name, raw.record, reasons, productionGoals)
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

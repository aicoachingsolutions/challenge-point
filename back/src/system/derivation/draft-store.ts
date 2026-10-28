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
 *   - an item without its sources (rows, each with a cited file and the words quoted) or without our reasoning (`fitNote`);
 *   - a source citing a file outside the workbooks the store can read, or a row that file does not hold, or words that are not verbatim in the
 *     row cited (whitespace runs aside, nothing is normalized); and a quotation in an item's `basisEvidence` that is not verbatim in a row the
 *     item cites;
 *   - for a drafted context, a PRIMARY_SCORING_CONDITION row the workbook holds for it that no item constituting a scoring condition cites:
 *     with every condition item removed, a draft context once composed the plain game form's activity with every check passing
 *     (`docs/audits/drafts/ta02-composition/evidence/probe-k1-final.txt`, run U3), because the context-scoring guard can check only what the
 *     contract constitutes;
 *   - a record for a goal that has a production record, citing any ruling, or carrying what only his rulings give a record (a provisional
 *     realization, realizations, provisional choices, authorized adjustments, a review request), or refused by the record gate as a draft.
 *
 * Every DRAFT file of the folder the store does not read is listed with why (`notRead`), never skipped silently.
 */
import fs from 'node:fs'
import path from 'node:path'

import { constitutedConditionTypes } from '../rendering/context-scoring-guard'
import { PRIMARY_SCORING_CONDITION } from '../sport-module/rpc-library'
import { learningGoalAuthorizations, LearningGoalAuthorization, validateLearningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { loadCorpusContracts, loadProvisionalRealizations, loadSportProfile, objectIdOf } from './corpus'
import { knowledgeKey } from './knowledge-key'
import { AUDITS_DIR } from './knowledge-root'
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

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const norm = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** Every string inside a value, recursively. */
function stringsOf(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) value.forEach(entry => stringsOf(entry, out))
    else if (value && typeof value === 'object') Object.values(value).forEach(entry => stringsOf(entry, out))
    return out
}

/** The rows of a workbook a row id names: every object whose id-like key (`…id`, `…ID`) holds exactly that id. */
function rowsNamed(workbook: unknown, rowId: string): unknown[] {
    const found: unknown[] = []
    const walk = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(walk)
        if (!node || typeof node !== 'object') return
        for (const [key, value] of Object.entries(node)) if (/id$/i.test(key) && value === rowId) found.push(node)
        Object.values(node).forEach(walk)
    }
    walk(workbook)
    return found
}

/** The quotations a source's text makes: its double-quoted fragments where it has any (a rendering of a row's fields), else the whole text. */
function quotationsOf(text: string): string[] {
    const quoted = [...text.matchAll(/"([^"]+)"/g)].map(match => match[1])
    return quoted.length ? quoted : [text]
}

/** Whether every part of a quotation (an ellipsis separates parts) is verbatim in one string of the rows. */
function verbatimIn(quotation: string, rows: unknown[]): boolean {
    const hay = rows.flatMap(row => stringsOf(row)).map(norm)
    return quotation
        .split('...')
        .map(norm)
        .filter(Boolean)
        .every(part => hay.some(text => text.includes(part)))
}

/**
 * **Load the draft store of one folder, or refuse it whole.** `folder` is a folder name under `docs/audits/drafts/`, or (tests only) an
 * absolute path to a TEST-ONLY copy. Throws `DraftStoreRefused` naming every defect.
 */
export function loadDraftStore(folder: string): DraftStoreContents {
    const dir = path.isAbsolute(folder) ? folder : path.join(DRAFTS_DIR, folder)
    const reasons: string[] = []
    if (!fs.existsSync(dir)) throw new DraftStoreRefused(folder, [`no such folder: ${dir}`])
    const names = fs
        .readdirSync(dir)
        .filter(name => name.endsWith('.DRAFT.json'))
        .sort()
    if (!names.length) throw new DraftStoreRefused(folder, ['the folder holds no DRAFT file'])

    const workbooks = new Map<string, unknown>()
    const workbook = (file: string): unknown => {
        if (!workbooks.has(file)) workbooks.set(file, JSON.parse(fs.readFileSync(DRAFT_WORKBOOKS[file], 'utf8').replace(/^﻿/, '')))
        return workbooks.get(file)
    }
    const production = [...loadCorpusContracts(), ...loadSportProfile(), ...loadProvisionalRealizations()]
    const productionKeys = new Set(production.map(contract => knowledgeKey(contract.contractId)))
    const productionItems = new Set(production.flatMap(contract => (contract.items ?? []).map(item => String(item.itemId))))
    const productionGoals = new Set(learningGoalAuthorizations().map(record => record.learningGoalId))
    const draftItems = new Set<string>()

    const files: string[] = []
    const notRead: { file: string; why: string }[] = []
    const contracts: LoadedContract[] = []
    const records: LearningGoalAuthorization[] = []

    for (const name of names) {
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
            const loaded = contractOf(name, raw.contractEntry, reasons, { productionKeys, productionItems, draftItems, workbook })
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
    workbook: (file: string) => unknown
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
        // An item written on his words (AUTHORED, OWNER_RULING) must cite the rows it quotes; an ASSUMED item claims no words of his and
        // establishes nothing (it bounds at most), so it may cite none, and its reasoning must say what it rests on.
        if (!sources.length && item?.basis !== 'ASSUMED') reasons.push(where(`cites no source row, and its basis ${JSON.stringify(item?.basis ?? null)} claims words that must be cited`))
        if (!Array.isArray(item?.source)) reasons.push(where('carries no list of sources'))
        const cited: unknown[] = []
        for (const source of sources) {
            const label = `source ${String(source?.rowId ?? '(no row)')}`
            if (!filled(source?.rowId) || !filled(source?.file) || !filled(source?.text)) {
                reasons.push(where(`${label} lacks its row, its file or the words it quotes`))
                continue
            }
            if (!(source.file in DRAFT_WORKBOOKS)) {
                reasons.push(where(`${label} cites ${source.file}, which is not a workbook this store reads`))
                continue
            }
            const rows = rowsNamed(ctx.workbook(source.file), String(source.rowId).split(' ')[0])
            if (!rows.length) {
                reasons.push(where(`${label}: ${source.file} holds no row ${String(source.rowId).split(' ')[0]}`))
                continue
            }
            cited.push(...rows)
            for (const quotation of quotationsOf(String(source.text))) if (!verbatimIn(quotation, rows)) reasons.push(where(`${label}: "${quotation}" is not verbatim in the row it cites`))
        }
        for (const match of String(item?.basisEvidence ?? '').matchAll(/"([^"]{12,})"/g)) {
            if (!verbatimIn(match[1], cited)) reasons.push(where(`basisEvidence quotes "${match[1]}", which is not verbatim in a row the item cites`))
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
     * requires is what the guard will hold the game to.
     */
    const contextRows = ((ctx.workbook(CONTEXT_WORKBOOK) as any)?.properties ?? []).filter((row: any) => row?.rpc_id === objectId && row?.property_category === PRIMARY_SCORING_CONDITION)
    const constituting = new Set(constitutedConditionTypes(contract).map(entry => entry.itemId))
    for (const row of contextRows) {
        const rowId = String(row.property_id)
        const citing = (result.items as any[]).filter(item => constituting.has(String(item?.id)) && (Array.isArray(item?.source) ? item.source : []).some((source: any) => String(source?.rowId ?? '').split(' ')[0] === rowId))
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

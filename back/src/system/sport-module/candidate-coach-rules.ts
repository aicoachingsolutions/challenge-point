/**
 * **For tests only.** The reader of our CANDIDATE coach rules for High Press Escape (RPC-002), and the gate it holds them to.
 *
 * Added 11 November 2026 (A02 package, stage W3). Christian's reply received 11 November 2026, second reply, item 4: "Please include a
 * focused source-to-code check in the A02 work and prepare the smallest correction that faithfully preserves the approved meaning."
 * "Where the intended interpretation is already unambiguous, you may correct it within the isolated, non-deployed pathway and test it."
 * (received 11 November 2026, second reply). The file it reads (docs/audits/drafts/a02-composition/rpc-002-coach-rules.CANDIDATE.json)
 * holds, for each live High Press Escape rule, the candidate that says the approved row's 'through the next action' in place of 'with
 * the next pass', every other word kept, and the source-to-code check that found the narrowing, clause by clause.
 *
 * NOT LIVE. The live rules (primary-scoring.ts, COACH_RULES) are unchanged, and no route or engine module imports this reader:
 * primary-scoring.unit.ts holds that by a scan. The candidate is our wording, for review; it never enters the approved coach wording.
 *
 * THE GATE (candidateCoachRulesRefusals), every defect named, the file refused whole on any:
 *   - the file and each rule stand CANDIDATE (TEST-ONLY, NOT APPROVED, NOT LIVE);
 *   - the replacement's new words are verbatim in its source row and its old words are not;
 *   - each rule's live text is the live rule, word for word (so a change of the live rule retires the file), holds the old words once,
 *     and its candidate is that text with only the replacement made; every live rule or setup holding the old words is covered;
 *   - each rule's check names its event, progression, control and origin clauses, each verbatim in the live rule or setup, covers every
 *     action word the live rule and setup name, and corrects exactly the clauses it finds NARROWED;
 *   - every source, other row and question cites a row of the RPC library whose key its line holds and whose words it quotes verbatim.
 *
 * Stage B2 of the A02 complete-activity package (12 November 2026): DECLARED CHANGES. Christian, received 12 November 2026: "I approve
 * replacing "with the next pass" with "through the next action" in principle for the four High Press Escape rules." and "However, please hold
 * their final coach-facing wording for review alongside the complete A02 activity." The file may declare further changes (`declared`), each
 * with its words, where it applies (the rule or the setup), why (ours) and Christian's words it rests on with the received date; the candidate
 * rule is then the live rule with the replacement made and every declared rule change made once, in order, and the candidate setup
 * (`setupCandidate`) the live setup with every declared setup change made once; any other change is refused, as before. A clause the
 * check finds OVER_APPLIED is corrected only by a declared change whose words are that clause; a clause NARROWED only by the replacement (and
 * the declared changes made in its words). The declared changes the file holds are pinned by primary-scoring.unit.ts.
 *
 * Sport-specific (it reads the soccer RPC library), so it sits in the sport layer.
 */
import fs from 'node:fs'
import path from 'node:path'

import { AUDITS_DIR } from '../derivation/knowledge-root'
import { actionWordsIn, actionClassesIn } from './action-words'
import { COACH_RULES } from './primary-scoring'
import rpcWorkbook from './rpc-library.rc1.json'

export const CANDIDATE_COACH_RULES_FILE = path.join(AUDITS_DIR, 'drafts', 'a02-composition', 'rpc-002-coach-rules.CANDIDATE.json')
const LIBRARY_FILE = 'back/src/system/sport-module/rpc-library.rc1.json'
const LIBRARY_PATH = path.join(__dirname, 'rpc-library.rc1.json')

export const CLAUSE_COMPONENTS = ['EVENT', 'PROGRESSION', 'CONTROL', 'ORIGIN'] as const
export const CLAUSE_VERDICTS = ['FAITHFUL', 'NARROWED', 'WIDER', 'REALIZATION', 'OVER_APPLIED'] as const
export const CLAUSE_ACTIONS = ['CORRECTED_IN_CANDIDATE', 'REPORTED_NOT_CHANGED'] as const
export const QUESTION_IDS = ['Q-a', 'Q-b', 'Q-c', 'Q-d'] as const

export interface CitedWords {
    rowId: string
    line: number
    words: string
}
export interface CheckedClause {
    clause: string
    in: 'rule' | 'setup'
    component: (typeof CLAUSE_COMPONENTS)[number]
    verdict: (typeof CLAUSE_VERDICTS)[number]
    action: (typeof CLAUSE_ACTIONS)[number]
    eventStanding?: 'APPROVED' | 'UNREVIEWED'
    sources: CitedWords[]
    note: string
}
export interface CandidateRule {
    key: string
    live: string
    candidate: string
    /** Stage B2: the live setup with every declared setup change made; absent where no declared change applies to setups. */
    setupCandidate?: string
    label: 'CANDIDATE'
}
/** Stage B2: a change the file declares beside the replacement, made once in every rule (or setup) it applies to. */
export interface DeclaredChange {
    id: string
    in: 'rule' | 'setup'
    from: string
    to: string
    why: string
    christian: ChristianWords[]
}
export interface ChristianWords {
    quote: string
    received: string
}
export interface CandidateCoachRules {
    standing: string
    label: 'CANDIDATE'
    about: string
    basis: { source: CitedWords & { file: string; provenance: string }; authority: ChristianWords[]; reading: string; productionBoundary: string }
    replacement: { from: string; to: string; toIsVerbatimIn: string }
    declared?: DeclaredChange[]
    rules: CandidateRule[]
    sourceToCode: { key: string; clauses: CheckedClause[] }[]
    otherRowsNamingAnAction: (CitedWords & { actionClass: string; reading: string })[]
    questions: { id: (typeof QUESTION_IDS)[number]; question: string; sources: CitedWords[]; christian: ChristianWords[] }[]
}

export class CandidateCoachRulesRefused extends Error {
    readonly reasons: string[]
    constructor(reasons: string[]) {
        super(`The CANDIDATE coach rules are refused:\n  - ${reasons.join('\n  - ')}`)
        this.name = 'CandidateCoachRulesRefused'
        this.reasons = reasons
    }
}

type Row = Record<string, unknown>
const TABLE_KEYS: Readonly<Record<string, string>> = {
    statements: 'statement_id',
    relationships: 'relationship_id',
    properties: 'property_id',
    identity_rules: 'identity_rule_id',
    validation_rules: 'validation_id',
}
const workbook = rpcWorkbook as unknown as Record<string, Row[]>
let libraryLines: string[] | null = null
const linesOfLibrary = (): string[] => (libraryLines ??= fs.readFileSync(LIBRARY_PATH, 'utf8').replace(/^﻿/, '').split(/\r?\n/))

/**
 * A row of the RPC library by its id: a row id of a keyed table, or 'vocabulary:value' for the controlled vocabulary. With the field and
 * value its line must hold, and every string of the row (the words it may quote).
 */
export function libraryRow(rowId: string): { row: Row; keyField: string; keyValue: string; strings: string[] } | null {
    const vocabulary = /^([a-z_]+):([a-z_]+)$/.exec(rowId)
    let row: Row | undefined
    let keyField = ''
    let keyValue = rowId
    if (vocabulary) {
        row = (workbook['controlled_vocabulary'] ?? []).find((entry) => entry['vocabulary'] === vocabulary[1] && entry['value'] === vocabulary[2])
        keyField = 'value'
        keyValue = vocabulary[2]!
    } else {
        for (const [table, key] of Object.entries(TABLE_KEYS)) {
            row = (workbook[table] ?? []).find((entry) => entry[key] === rowId)
            if (row) {
                keyField = key
                break
            }
        }
    }
    if (!row) return null
    return { row, keyField, keyValue, strings: Object.values(row).filter((value): value is string => typeof value === 'string') }
}

/** Why a citation does not hold: its row unknown, its line not the row's key, or its words not verbatim in the row. Null where it holds. */
export function citationUnusableBecause(cited: Partial<CitedWords> | undefined): string | null {
    if (!cited || typeof cited.rowId !== 'string' || typeof cited.words !== 'string' || !cited.words) return 'it names no row or no words'
    const found = libraryRow(cited.rowId)
    if (!found) return `${cited.rowId} is no row of the RPC library`
    const held = Number.isInteger(cited.line) && (cited.line as number) > 0 ? linesOfLibrary()[(cited.line as number) - 1] : undefined
    if (held === undefined || !held.includes(`${JSON.stringify(found.keyField)}: ${JSON.stringify(found.keyValue)}`)) return `line ${JSON.stringify(cited.line ?? null)} of ${LIBRARY_FILE} is not the line holding ${found.keyField} of ${cited.rowId}`
    if (!found.strings.some((text) => text.includes(cited.words!))) return `"${cited.words}" is not verbatim in ${cited.rowId}`
    return null
}

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const count = (text: string, part: string): number => (part ? text.split(part).length - 1 : 0)

/** Every defect of a CANDIDATE overlay held against the live rules; empty where it holds. */
export function candidateCoachRulesRefusals(overlay: any, live: typeof COACH_RULES = COACH_RULES): string[] {
    const reasons: string[] = []
    const cite = (where: string, cited: any) => {
        const why = citationUnusableBecause(cited)
        if (why) reasons.push(`${where}: ${why}`)
    }
    if (!filled(overlay?.standing) || !overlay.standing.startsWith('CANDIDATE') || !['TEST-ONLY', 'NOT APPROVED', 'NOT LIVE'].every((words) => overlay.standing.includes(words)))
        reasons.push('the file does not stand CANDIDATE, TEST-ONLY, NOT APPROVED and NOT LIVE')
    if (overlay?.label !== 'CANDIDATE') reasons.push(`the file is labelled ${JSON.stringify(overlay?.label ?? null)}, not CANDIDATE`)

    const from = overlay?.replacement?.from
    const to = overlay?.replacement?.to
    if (!filled(from) || !filled(to) || from === to) {
        reasons.push('the replacement names no old words or no new words')
        return reasons
    }
    const source = overlay?.basis?.source
    cite('basis.source', source)
    if (source?.rowId !== overlay.replacement.toIsVerbatimIn) reasons.push(`the replacement's new words are said to be verbatim in ${overlay.replacement.toIsVerbatimIn}, and the basis cites ${source?.rowId}`)
    const sourceStrings = libraryRow(String(source?.rowId ?? ''))?.strings ?? []
    if (!sourceStrings.some((text) => text.includes(to))) reasons.push(`the new words "${to}" are not verbatim in ${source?.rowId}`)
    if (sourceStrings.some((text) => text.includes(from))) reasons.push(`the old words "${from}" are in ${source?.rowId}: nothing to correct`)
    if (!Array.isArray(overlay?.basis?.authority) || !overlay.basis.authority.length || !overlay.basis.authority.every((w: any) => filled(w?.quote) && filled(w?.received)))
        reasons.push("the basis quotes no words of Christian's with the date received")

    // Stage B2: the declared changes, each whole: its words, where it applies, why (ours) and Christian's words with the date received.
    const declared: any[] = overlay?.declared === undefined ? [] : Array.isArray(overlay.declared) ? overlay.declared : []
    if (overlay?.declared !== undefined && !Array.isArray(overlay.declared)) reasons.push('the declared changes are not a list')
    const declaredIds = declared.map((d) => String(d?.id))
    if (new Set(declaredIds).size !== declaredIds.length) reasons.push('a declared change is listed twice')
    for (const d of declared) {
        const at = `declared change ${d?.id}`
        if (!filled(d?.id) || (d?.in !== 'rule' && d?.in !== 'setup') || !filled(d?.from) || typeof d?.to !== 'string' || d.from === d.to || !filled(d?.why)) reasons.push(`${at} names its id, where it applies (rule or setup), the words it replaces, the words it puts in their place and why`)
        if (d?.in === 'rule' && !filled(d?.to)) reasons.push(`${at}: a rule change puts words in place of the words it replaces (only a setup change may drop words)`)
        if (!Array.isArray(d?.christian) || !d.christian.length || !d.christian.every((w: any) => filled(w?.quote) && filled(w?.received))) reasons.push(`${at} quotes none of Christian's words with the date received`)
    }
    /** `text` with each declared change for `where` made once, in order (`strict`: each must occur exactly once; else one that does not occur is passed over). */
    const withDeclared = (text: string, where: 'rule' | 'setup', strict: boolean, at: string): string => {
        let out = text
        for (const d of declared.filter((x) => x?.in === where && filled(x?.from) && typeof x?.to === 'string')) {
            const n = count(out, d.from)
            if (strict && n !== 1) reasons.push(`${at}: the declared change ${d.id}'s words "${d.from}" occur ${n} times, not once`)
            if (n >= 1) out = out.replace(d.from, d.to)
        }
        return out
    }

    // The rules: anchored to the live text, the replacement and the declared changes alone, every live rule holding the old words covered.
    const rules: any[] = Array.isArray(overlay?.rules) ? overlay.rules : []
    const keys = rules.map((rule) => String(rule?.key))
    if (new Set(keys).size !== keys.length) reasons.push('a rule is listed twice')
    for (const rule of rules) {
        const at = `rule ${rule?.key}`
        if (rule?.label !== 'CANDIDATE') reasons.push(`${at} is labelled ${JSON.stringify(rule?.label ?? null)}, not CANDIDATE`)
        const current = live[rule?.key]
        if (!current) {
            reasons.push(`${at} is no live coach rule`)
            continue
        }
        if (rule.live !== current.rule) reasons.push(`${at}: its live text is not the live rule, word for word`)
        if (count(current.rule, from) !== 1) reasons.push(`${at}: the live rule holds "${from}" ${count(current.rule, from)} times, not once`)
        if (rule.candidate !== withDeclared(current.rule.replace(from, to), 'rule', true, at)) reasons.push(`${at}: the candidate is not the live rule with only "${from}" replaced by "${to}" and the declared changes made`)
        // Stage B2: the setup, with only the declared setup changes made (none declared: no candidate setup, the live one kept).
        const setupChanges = declared.some((d) => d?.in === 'setup')
        if (setupChanges ? rule.setupCandidate !== withDeclared(current.setup, 'setup', true, `${at} (setup)`) : rule.setupCandidate !== undefined) reasons.push(`${at}: the candidate setup is not the live setup with only the declared setup changes made`)
    }
    const holding = Object.keys(live).filter((key) => (live[key]!.rule + ' ' + live[key]!.setup).includes(from))
    for (const key of holding) if (!keys.includes(key)) reasons.push(`the live rule ${key} holds "${from}" and has no candidate`)

    // The source-to-code check, rule by rule.
    const checks: any[] = Array.isArray(overlay?.sourceToCode) ? overlay.sourceToCode : []
    if ([...checks.map((c) => String(c?.key))].sort().join('\n') !== [...keys].sort().join('\n')) reasons.push('the source-to-code check does not cover exactly the rules')
    for (const check of checks) {
        const current = live[check?.key]
        const candidate = rules.find((rule) => rule?.key === check?.key)?.candidate
        if (!current || typeof candidate !== 'string') continue
        const clauses: any[] = Array.isArray(check.clauses) ? check.clauses : []
        for (const component of CLAUSE_COMPONENTS) if (!clauses.some((c) => c?.component === component)) reasons.push(`check ${check.key}: no ${component} clause`)
        const spans: { in: string; start: number; end: number }[] = []
        for (const clause of clauses) {
            const at = `check ${check.key}, clause "${clause?.clause}"`
            const text = clause?.in === 'setup' ? current.setup : clause?.in === 'rule' ? current.rule : null
            if (text === null) reasons.push(`${at}: it is in neither the rule nor the setup`)
            else if (!filled(clause.clause) || !text.includes(clause.clause)) reasons.push(`${at}: not verbatim in the live ${clause.in}`)
            else for (let i = text.indexOf(clause.clause); i >= 0; i = text.indexOf(clause.clause, i + 1)) spans.push({ in: clause.in, start: i, end: i + clause.clause.length })
            if (!CLAUSE_COMPONENTS.includes(clause?.component)) reasons.push(`${at}: component ${JSON.stringify(clause?.component ?? null)}`)
            if (!CLAUSE_VERDICTS.includes(clause?.verdict)) reasons.push(`${at}: verdict ${JSON.stringify(clause?.verdict ?? null)}`)
            if (!CLAUSE_ACTIONS.includes(clause?.action)) reasons.push(`${at}: action ${JSON.stringify(clause?.action ?? null)}`)
            if (!filled(clause?.note)) reasons.push(`${at}: no note`)
            const narrowed = clause?.verdict === 'NARROWED'
            // Stage B2: a clause OVER_APPLIED is corrected only by a declared change whose words are that clause, in the same text.
            const declaredFor = declared.find((d) => d?.in === clause?.in && filled(d?.from) && d.from.trim() === clause?.clause)
            const overApplied = clause?.verdict === 'OVER_APPLIED' && declaredFor !== undefined
            if ((narrowed || overApplied) !== (clause?.action === 'CORRECTED_IN_CANDIDATE')) reasons.push(`${at}: a clause is corrected exactly where it is found NARROWED, or OVER_APPLIED and replaced by a declared change`)
            if (narrowed && (!String(clause.clause).includes(from) || !candidate.includes(withDeclared(String(clause.clause).replace(from, to), 'rule', false, at)))) reasons.push(`${at}: the corrected clause is not the candidate's, with only the replacement and the declared changes made`)
            if (overApplied && clause?.in === 'rule' && (candidate.includes(clause.clause) || !candidate.includes(declaredFor!.to))) reasons.push(`${at}: the corrected clause is not replaced in the candidate by the declared change ${declaredFor!.id}`)
            if (!narrowed && !overApplied && clause?.in === 'rule' && filled(clause?.clause) && !candidate.includes(clause.clause)) reasons.push(`${at}: a clause not corrected is changed in the candidate`)
            const sources: any[] = Array.isArray(clause?.sources) ? clause.sources : []
            if (!sources.length) reasons.push(`${at}: no source`)
            sources.forEach((cited, i) => cite(`${at}, source ${i + 1}`, cited))
        }
        // Every action word of the live rule and setup lies inside a checked clause.
        for (const [where, text] of [['rule', current.rule], ['setup', current.setup]] as const) {
            for (const word of actionWordsIn(text)) {
                if (!spans.some((span) => span.in === where && word.at >= span.start && word.at < span.end)) reasons.push(`check ${check.key}: the ${where}'s action word '${word.word}' lies in no checked clause`)
            }
        }
    }

    for (const other of Array.isArray(overlay?.otherRowsNamingAnAction) ? overlay.otherRowsNamingAnAction : []) {
        cite(`other row ${other?.rowId}`, other)
        if (!actionClassesIn(String(other?.words ?? '')).includes(other?.actionClass)) reasons.push(`other row ${other?.rowId}: its words name no '${other?.actionClass}'`)
        if (!filled(other?.reading)) reasons.push(`other row ${other?.rowId}: no reading`)
    }

    const questions: any[] = Array.isArray(overlay?.questions) ? overlay.questions : []
    if (questions.map((q) => q?.id).join(',') !== QUESTION_IDS.join(',')) reasons.push(`the questions are not ${QUESTION_IDS.join(', ')}, in that order`)
    for (const question of questions) {
        if (!filled(question?.question)) reasons.push(`question ${question?.id}: no question`)
        const sources: any[] = Array.isArray(question?.sources) ? question.sources : []
        if (!sources.length) reasons.push(`question ${question?.id}: no source row`)
        sources.forEach((cited, i) => cite(`question ${question?.id}, source ${i + 1}`, cited))
        if (!Array.isArray(question?.christian) || !question.christian.every((w: any) => filled(w?.quote) && filled(w?.received))) reasons.push(`question ${question?.id}: Christian's words without the date received`)
    }
    return reasons
}

/** Read and gate the CANDIDATE overlay; throws CandidateCoachRulesRefused naming every defect. */
export function loadCandidateCoachRules(file: string = CANDIDATE_COACH_RULES_FILE, live: typeof COACH_RULES = COACH_RULES): CandidateCoachRules {
    const overlay = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    const reasons = candidateCoachRulesRefusals(overlay, live)
    if (reasons.length) throw new CandidateCoachRulesRefused(reasons)
    return overlay as CandidateCoachRules
}

/** The live coach rules with each CANDIDATE rule in place of its live text (setup and evidence kept): a copy, for tests. */
export function overlaidCoachRules(overlay: CandidateCoachRules, live: typeof COACH_RULES = COACH_RULES): Record<string, (typeof COACH_RULES)[string]> {
    const copy: Record<string, (typeof COACH_RULES)[string]> = JSON.parse(JSON.stringify(live))
    for (const rule of overlay.rules) copy[rule.key] = { ...copy[rule.key]!, rule: rule.candidate, ...(rule.setupCandidate !== undefined ? { setup: rule.setupCandidate } : {}) }
    return copy
}

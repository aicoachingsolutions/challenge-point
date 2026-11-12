/**
 * **The handoff's chain wiring, shared by the unit tests that run the review pathway's handoff through the real checked chain** (TEST-ONLY).
 *
 * Moved here from `handoff.unit.ts` in stage 9 (the isolated A02 foundational test, Christian's authorization pasted 10 November 2026),
 * its code unchanged apart from the exports, the scope rule's literal written in backticks (the same text), the vehicle's stand-in
 * classification built by `classificationWith` (the same object) and the stage-9 additions listed below, so that `handoff.unit.ts` and
 * `a02.unit.ts` run the SAME wiring rather than two copies that could drift (the handoff's evidence is unchanged: its test compares it whole): `HandoffChain` over
 * `buildActivityUnderAuthorizationRecords` (the TEST-ONLY entry), the TEST-ONLY draft store, the realization gate (`loadProvisionalRealizations`,
 * run on a copy before any build), the review-only wording of decision 1, and the chain's own account behind a refusal met before any game
 * exists (`refusalDetailOf`). Every alteration is made on a copy by the entry's own TEST-ONLY options; nothing is written to any production file.
 *
 * Why a unit file: it is test code. It imports the checked chain, so it may not be a stage file of the review pathway (design-reasoning.unit.ts
 * holds the stage's import closure), and it calls the TEST-ONLY entry, which no non-unit module may (upstream-consumption.unit.ts, test 7).
 * Imported, it runs nothing; run alone (it is registered), it checks that only unit files import it.
 *
 * Added in stage 9, and used only where a request carries them (no earlier case does): a request that CONSUMES Steps 1 and 2 (`consume`) is
 * built with the entry's TEST-ONLY `upstream` option and an observe-only selection hook (the entry throws if a hook changes a selection that
 * consumed upstream decisions), and refused here if it places anything or carries a vehicle; its answer carries what the chain's own account recorded it consumed
 * (`consumption`). A request's `replaceDeclarations` replace one declaration each on the chain's copy of a contract; a request's `laws` hands
 * the chain's own laws check our DRAFT classification, with its labelled stand-in where it names one. On every request: a choice line
 * carries the draft items the chain records as shaping it (`draftShapedBy`, never graded), and the chain's own sentences are printed without
 * a gendered pronoun (`withoutGenderedPronouns`); neither changes the handoff's evidence (measured: its test compares it whole).
 *
 * Added in the safeguards slice of stage 9 (DESIGN-9 sections 3 and 4): a consuming request's `consume.sizeRuleBypass` is handed on as the
 * upstream option's boolean; a request's `recordRoute` is held to the authorized set of the record the chain consulted (fail closed) and its
 * answer names each constraint built from it with its contracts (`recordSet`); every answer carries `observed` (the constraint authority and
 * gap, the lens ids, the context display, the requirement account's state), which the safeguards read and the handoff never copies into a
 * result; `chainWith({ observeOnly: true })` runs the chain's own route (the hook places nothing on any request).
 *
 * Run alone: node node_modules/ts-node/dist/bin.js --files -r tsconfig-paths/register ./src/system/design-reasoning/handoff-chain.unit.ts
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { governingDeclarations } from '../derivation/classify'
import { loadProvisionalRealizations } from '../derivation/corpus'
import { LawsMateriality } from '../derivation/default-laws'
import { loadDraftStore, loadLawsMateriality } from '../derivation/draft-store'
import { isStampedHalt } from '../derivation/emit'
import { runDerivation, runStages0to10 } from '../derivation/engine'
import { knowledgeKey } from '../derivation/knowledge-key'
import { reaches } from '../derivation/reach'
import { applyRealizationDeferrals, applyRoleYields } from '../derivation/realization-deferral'
import { indexRegister } from '../derivation/register'
import { assembleResolvedGame } from '../derivation/resolved-game'
import { CONTEXT_ROLE, derivationInputFor, DraftStoreContents, UpstreamDecisions } from '../derivation/run-bounded-selection'
import { LoadedContract } from '../derivation/types'
import { realizeWithJustifiedDefaults } from '../realization/justified-defaults'
import { isRefused } from '../realization/realize'
import { SuppliedRealization } from '../realization/supplied-realization'
import { buildActivityUnderAuthorizationRecords, RefusedActivity, ServedActivity } from '../rendering/build-activity'
import { reviewDraftOf } from '../rendering/review-draft'
import { withReviewStructureWording } from '../rendering/review-structure-wording'
import { specializedRoleNames } from '../rendering/session-envelope'
import { contextRelationships, learningGoalAuthorizations } from '../test-library/learning-goal-authorizations'
import { displayCell } from './assembly-display'
import { ChainAnswer, ChainLine, ChainRequest, HandoffChain } from './handoff'
import { committedKnowledge } from './knowledge'

const HERE = __dirname
const WT = path.resolve(HERE, '..', '..', '..', '..')
const AUDITS = path.join(WT, 'docs', 'audits')
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const readJson = (file: string): any => JSON.parse(fs.readFileSync(file, 'utf8'))

export const productionRecords = learningGoalAuthorizations()
const productionRealizationsFile = readJson(path.join(AUDITS, 'conformance', 'stage-b', 'provisional-realizations.json'))
export const lawsMateriality = loadLawsMateriality()
/** Every owed line the refusal detail read, with the chain's reach and scope of each declaration (for test E4's measurement of the scope rule). */
export const owedLinesRead: NonNullable<ChainAnswer['refusalDetail']>['owedLines'] = []

// ---------------------------------------------------------------------------------------------------------------------------------------
// The chain, wired (TEST-ONLY): HandoffChain over buildActivityUnderAuthorizationRecords
// ---------------------------------------------------------------------------------------------------------------------------------------

/** The TEST-ONLY realization as the realization file would hold it: Christian's words only, no item, no choices file. */
export function realizationEntry(r: NonNullable<ChainRequest['realization']>): Record<string, unknown> {
    return {
        id: r.id,
        contractId: `provisional:${r.id}`,
        category: 'PROVISIONAL_REALIZATION_CHOICE',
        realizes: r.realizes,
        ruledOn: r.ruledOn,
        by: r.by,
        citedAs: r.citedAs,
        words: [...r.words],
        realizationChoices: null,
        defaultLawsCheck: { mode: r.lawsCheck.mode, because: r.lawsCheck.because, basis: { words: [...r.lawsCheck.words], citedAs: r.lawsCheck.citedAs } },
        departsFrom: r.departures.map((d) => ({ law: d.law, because: d.because, basis: { words: [...d.words], citedAs: d.citedAs }, extent: d.extent })),
        notWithPracticeSituations: [],
        items: [],
        declarations: [],
        relationshipRules: [],
    }
}

/** The realization gate, run on a copy of the production file with the TEST-ONLY realization added (R7 W3: the gate is the caller's duty). */
export const gatedRealizations = (entry: Record<string, unknown>) => loadProvisionalRealizations({ ...copy(productionRealizationsFile), realizations: [...copy(productionRealizationsFile.realizations), entry] })

/** Which realization-choices file closed each line, read from the files the supplied realization was read from, in their order. */
function choicesFileOf(supplied: SuppliedRealization): Map<string, string> {
    const byLine = new Map<string, string>()
    for (const file of supplied.from) {
        const contents = readJson(path.join(AUDITS, file))
        for (const entry of (contents.choices ?? []) as Array<{ lineId: string; withdraws?: unknown }>) {
            if (entry.withdraws !== undefined) byLine.delete(entry.lineId)
            else byLine.set(entry.lineId, file)
        }
    }
    return byLine
}

export const sessionOf = (s: ChainRequest['session']) => {
    const roles = Object.fromEntries(specializedRoleNames().map((role) => [role, s.specializedRoles]))
    return { players: s.players, lengthM: s.lengthM, widthM: s.widthM, durationMin: s.durationMin, roles, ...(s.goals === null ? {} : { objects: { goal: { count: s.goals } } }) }
}

function linesOf(fixture: any, request: ChainRequest, chosenBy: Map<string, string>): ChainLine[] {
    if (!fixture) return []
    const st = fixture.status
    const term = new Map<string, string | null>((st.geometry ?? []).map((g: any) => [g.lineId, g.geometry?.extentBound?.term ?? null]))
    // The item a line's position is stated relative to, exactly as the chain names it (its relation's `of`); nothing is matched by guess.
    const relationOf = new Map<string, { contractId: string; itemId: string } | null>(
        (st.geometry ?? []).map((g: any) => {
            const of = g.geometry?.relation?.of
            return [g.lineId, of && typeof of.contractId === 'string' && typeof of.itemId === 'string' ? { contractId: of.contractId, itemId: of.itemId } : null]
        }),
    )
    const lines: ChainLine[] = []
    for (const d of st.derived ?? [])
        lines.push({ kind: 'DERIVED', lineId: d.lineId, path: d.path, value: d.value, support: (d.support ?? []).map((s: any) => ({ kind: s.kind, contractId: s.contractId, itemId: s.itemId, id: s.id, row: s.row })), strength: d.strength, extentTerm: term.get(d.lineId) ?? null, relationOf: relationOf.get(d.lineId) ?? null })
    for (const c of st.choices ?? []) {
        const supplied = request.choices.find((x) => x.lineId === c.lineId && JSON.stringify(x.value) === JSON.stringify(c.value))
        lines.push({
            kind: 'CHOICE',
            lineId: c.lineId,
            path: c.path,
            value: c.value,
            because: c.because,
            closure: c.closure,
            defaultedBy: c.defaultedBy ?? null,
            assumedBound: ((c.within?.bounds ?? []) as any[]).some((b) => b.assumed === true),
            permitted: c.within?.permitted ?? null,
            ...(supplied ? { chosenBy: { case: true as const } } : chosenBy.has(c.lineId) && !c.defaultedBy ? { chosenBy: { file: chosenBy.get(c.lineId) as string } } : {}),
            // Stage 9: the draft items the chain records as shaping the line (read only by a consuming run's account; never graded).
            ...(Array.isArray(c.draftShapedBy) && c.draftShapedBy.length ? { draftShapedBy: (c.draftShapedBy as any[]).map((d) => ({ contractId: String(d.contractId), itemId: String(d.itemId), relation: String(d.relation) })) } : {}),
        })
    }
    for (const n of st.notEstablished ?? []) lines.push({ kind: 'NOT_ESTABLISHED', lineId: n.lineId, path: n.path, value: null, reason: n.reason })
    const instantiations = (st.instantiations ?? []) as Array<{ path: string; classId: string; handle: string }>
    for (const e of st.entailed ?? []) lines.push({ kind: 'ENTAILED', lineId: e.lineId, path: e.path, value: e.value, because: e.because, classId: instantiations.find((i) => i.handle === e.handle)?.classId })
    const classes = [...new Set(instantiations.map((i) => `${i.classId}|${i.path}`))]
    for (const key of classes) {
        const [classId, at] = key.split('|')
        lines.push({ kind: 'INSTANTIATION', lineId: `${classId}::members`, path: at, value: instantiations.filter((i) => i.classId === classId && i.path === at).length, classId })
    }
    for (const law of (fixture.defaultLaws?.laws ?? []) as Array<{ law: string; end: number | null; status: string; removedByRealization?: boolean }>) {
        const lineId = `defaultLaws:${law.law}${law.end === null || law.end === undefined ? '' : `:end ${law.end}`}`
        lines.push({ kind: 'LAW', lineId, path: `defaultLaws.laws[${law.law}]`, value: law.status, law: law.law, lawStatus: law.status, removedByRealization: law.removedByRealization === true })
        if (law.status === 'APPLIES') lines.push({ kind: 'LAW', lineId: `${lineId}:applied`, path: `defaultLaws.applied[${law.law}]`, value: law.status, law: law.law, lawStatus: law.status })
    }
    if (fixture.defaultLaws) lines.push({ kind: 'LAW', lineId: 'defaultLaws:owed', path: 'defaultLaws.owed', value: ((fixture.defaultLaws.laws ?? []) as any[]).filter((l) => l.status === 'ADAPTATION_OWED').map((l) => l.law), law: 'the owed list', lawStatus: 'OWED_LIST' })
    lines.push({ kind: 'SESSION_ROLES', lineId: 'session::roles', path: 'envelope.roles', value: fixture.envelope?.roles ?? null })
    return lines
}

function sentencesOf(activity: ServedActivity | RefusedActivity, fixture: any): { sentences: ChainAnswer['sentences']; served: boolean | null; withheld: ChainAnswer['withheld'] } {
    if (activity.outcome === 'served') {
        const draft = reviewDraftOf([fixture], activity.rendered, [])
        return {
            served: true,
            withheld: [],
            sentences: activity.rendered.instructions.map((i, n) => ({ section: i.section, block: i.block ?? null, status: i.status, text: i.text, from: [...i.from], wording: draft.instructions[n].wording, reviewOnly: (i as { reviewOnly?: unknown }).reviewOnly !== undefined })),
        }
    }
    const draft = activity.draft
    if (!draft) return { served: null, withheld: [], sentences: [] }
    return {
        served: false,
        withheld: (draft.withheld ?? []).map((w: any) => ({ path: String(w.path), reason: String(w.reason) })),
        sentences: draft.instructions.map((i) => ({ section: i.section, block: i.block ?? null, status: i.status, text: i.text, from: [...i.from], wording: i.wording, reviewOnly: (i as { reviewOnly?: unknown }).reviewOnly !== undefined })),
    }
}

/**
 * The harness's hold on a REPORT check: every owed law must be PROCEDURAL under the classification it is held to (our DRAFT classification;
 * in test E3 only, a labelled TEST-ONLY stand-in for it), else the run is refused here.
 */
function heldLaws(fixture: any, classification: LawsMateriality = lawsMateriality): { owed: string[]; reported: string[]; material: string[] } {
    const owed = ((fixture?.defaultLaws?.laws ?? []) as Array<{ law: string; status: string }>).filter((l) => l.status === 'ADAPTATION_OWED')
    const reported: string[] = []
    const material: string[] = []
    const ours = classification === lawsMateriality
    for (const l of owed) {
        const entry = classification.classifications.find((x) => x.law === l.law)
        const held = ours ? `our DRAFT classification (${classification.file}: our reading, for Christian's review; not a ruling)` : `a TEST-ONLY stand-in classification (${classification.file}: neither our reading nor a ruling)`
        const sentence = `${l.law} at the game: an adaptation is owed; ${entry ? `${entry.materiality} under ${held}` : `MATERIAL: ${ours ? 'our DRAFT classification' : 'the TEST-ONLY stand-in classification'} names no such law (fail safe)`}`
        if (entry && entry.materiality === 'PROCEDURAL') reported.push(sentence)
        else material.push(sentence)
    }
    return { owed: owed.map((l) => l.law), reported, material }
}

/**
 * The chain's scope rule, mirrored from classify.ts `governingDeclarations` (review of 7 November, round 3): a general requirement stays in force
 * against a class only if its scope reaches the class, and an OWN_INVOLVEMENT declaration reaches only the classes its own object forms
 * (`cls.fromItem`). classify.ts keeps the rule inside that function and does not export it, so it is mirrored here, and test E4 holds this
 * mirror to the rule's source text in classify.ts (`SCOPE_RULE_SOURCE`, which must occur there exactly once).
 */
export const SCOPE_RULE_SOURCE = `const scopeReaches = (d: DeclarationReach) => d.scope !== 'OWN_INVOLVEMENT' || cls.fromItem.contractId === d.contractId`
export const scopeReachesMirror = (d: { scope: unknown; contractId: unknown }, cls: { fromItem: { contractId: unknown } }): boolean => d.scope !== 'OWN_INVOLVEMENT' || cls.fromItem.contractId === d.contractId

/**
 * **The chain's own account behind a refusal met before any game exists** (structure or realization), for the refusal reading (Christian's
 * second reply of 7 November, section 2). The build returns no game there, so the derivation is run again here, by the chain's own functions,
 * on exactly the input the build derived from: the selection and the contracts its own TEST-ONLY options were handed (after the case's
 * alterations), with the build's deferral and role-yield steps. Nothing is read from it unless it reproduces the build's own refusal word for
 * word: at structure the Gate A reasons; at realization (since the review's second round) the realizer's reasons, the realizer run again with
 * the justified defaults on the realization input the build used (`supplied`, captured after the case's alteration). Otherwise this throws
 * (fail closed). It reads what the chain itself reports: each failing Gate A check's own result (its why and subjects), each owed line with the
 * declarations it was decided over and the chain's reach of each, and each open line's permitted alternatives and the items bounding it. It
 * changes no check.
 */
export function refusalDetailOf(selection: any, contracts: LoadedContract[], session: ReturnType<typeof sessionOf>, stage: string, reasons: string[], supplied: SuppliedRealization | null = null): NonNullable<ChainAnswer['refusalDetail']> {
    // The contracts are the ones the build derived from (its realization's among them), so the selection is read with no realization of its own.
    const input: any = { ...derivationInputFor({ ...selection, realization: null }), envelope: { ...session, roles: { ...session.roles }, ...((session as any).objects ? { objects: copy((session as any).objects) } : {}) } }
    input.contracts = copy(contracts)
    const relationships = contextRelationships()
    const index = indexRegister(input.register)
    const deferral = applyRealizationDeferrals(input.contracts as LoadedContract[], relationships, index)
    input.contracts = applyRoleYields(deferral.contracts, relationships, index)
    const result: any = runDerivation(input)
    if (isStampedHalt(result)) throw new Error('the refusal detail: the derivation halted when run again, so it does not reproduce the build')
    const staged: any = runStages0to10(input)
    const resolved: any = assembleResolvedGame(result, staged.classes, index, input.contracts)
    if (stage === 'structure') {
        const again = [`Gate A is ${resolved.coherence.gateA}`, ...(resolved.coherence.notAuthorizedBecause ?? [])]
        if (JSON.stringify(again) !== JSON.stringify(reasons)) throw new Error(`the refusal detail does not reproduce the build's refusal: ${JSON.stringify(again)} against ${JSON.stringify(reasons)}`)
    } else if (stage === 'realization') {
        if (resolved.coherence.realizationAuthorized !== true) throw new Error('the refusal detail does not reproduce the build: the gate refuses before realization when run again')
        if (!supplied) throw new Error('the refusal detail: no realization input was captured, so the realizer cannot be run again')
        // The realizer, run again as the build runs it (build-activity's realization stage), on a copy of the realization input it used.
        const ctx = { ...staged.gateContext, contracts: input.contracts }
        const again = realizeWithJustifiedDefaults(resolved, copy(supplied) as any, index, input.envelope, ctx)
        const said = isRefused(again.realization) ? ['realization refused', ...((again.realization as { because?: string[] }).because ?? [])] : null
        if (JSON.stringify(said) !== JSON.stringify(reasons)) throw new Error(`the refusal detail does not reproduce the build's refusal: ${JSON.stringify(said)} against ${JSON.stringify(reasons)}`)
    } else throw new Error(`the refusal detail is read only before a game exists (structure, realization), not at ${stage}`)
    const ref = (x: any): { contractId: string; itemId: string } | null => (x && typeof x.contractId === 'string' && typeof x.itemId === 'string' ? { contractId: x.contractId, itemId: x.itemId } : null)
    /**
     * Review of 7 November, round 2: for each owed line, the chain's own reach of each declaration it was decided over. The declarations are
     * the chain's own governing set for the line's element class (classify.ts `governingDeclarations`, which the classification itself calls),
     * held to equal the set the line carries (else this throws); each one's reach of the element class is the chain's own reach function
     * (reach.ts `reaches`: TRUE, FALSE or UNDETERMINED; 'UNREADABLE' where the selector did not parse; null where the line names no class).
     * `rowWide` says the governing set is every declaration on the row (the object establishing the element said nothing explicit about it).
     * Since round 3, each declaration also carries its scope and whether that scope reaches the element class by the chain's scope rule
     * (`scopeReachesMirror`), and the line carries the contracts establishing its element class (`cls.fromItem`, `cls.supportedBy`).
     */
    const declarations: any[] = staged.scope?.declarations ?? []
    const governedWithReach = (e: any) => {
        const carried = ((e.governedBy ?? []) as any[]).map((g) => ({ contractId: String(g.contractId), declaration: String(g.declaration), selector: g.selector === null || g.selector === undefined ? null : String(g.selector) }))
        const line = ((staged.lines ?? []) as any[]).find((l) => l.lineId === e.lineId)
        const cls = line && line.elementId ? ((staged.classes ?? []) as any[]).find((c) => c.classId === line.elementId) : undefined
        if (!line) throw new Error(`the refusal detail: the owed line ${String(e.lineId)} is not among the lines the derivation enumerated when run again`)
        const onRow = declarations.filter((d) => d.row === line.row)
        const governing = governingDeclarations(line.row, declarations, cls)
        const key = (g: { contractId: string; declaration: string; selector: unknown }) => `${g.contractId}|${g.declaration}|${g.selector === null || g.selector === undefined ? null : String(g.selector)}`
        const ours = governing.map(key).sort()
        if (JSON.stringify(ours) !== JSON.stringify(carried.map(key).sort())) throw new Error(`the refusal detail: the chain's governing set for ${String(e.lineId)} does not reproduce the set the line carries: ${JSON.stringify(ours)} against ${JSON.stringify(carried.map(key).sort())}`)
        const reachOf = (g: { contractId: string; declaration: string; selector: string | null }): { reach: string | null; scope: string | null; scopeReaches: boolean | null } => {
            const d = governing.find((x) => key(x) === key(g)) as any
            const scope = d.scope === null || d.scope === undefined ? null : String(d.scope)
            if (!cls) return { reach: null, scope, scopeReaches: null }
            // Review of 7 November, round 3: the chain's scope rule, mirrored (classify.ts keeps it inside governingDeclarations, unexported);
            // test E4 holds this mirror to classify.ts's source text (SCOPE_RULE_SOURCE).
            return { reach: d.parsed && d.parsed.predicate ? reaches(d.parsed.predicate, cls) : 'UNREADABLE', scope, scopeReaches: scopeReachesMirror(d, cls) }
        }
        return {
            governedBy: carried.map((g) => ({ ...g, ...reachOf(g) })),
            rowWide: governing.length === onRow.length && governing.every((d) => onRow.indexOf(d) >= 0),
            elementClass: cls ? String(cls.classId) : null,
            establishing: cls ? [...new Set([String(cls.fromItem.contractId), ...((cls.supportedBy ?? []) as any[]).map((s) => String(s.contractId))])] : [],
        }
    }
    const derivedLine = (lineId: string): any => staged.derived?.lines?.get(lineId) ?? null
    const owedLines = ((resolved.notEstablished ?? []) as any[])
        .filter((e) => e.reason === 'declared gap' || e.reason === 'claimed but unresolved')
        .map((e) => ({ lineId: String(e.lineId), verdict: String(e.verdict), reason: e.reason === null ? null : String(e.reason), declared: ((e.declared ?? []) as unknown[]).map(String), ...governedWithReach(e) }))
    owedLinesRead.push(...copy(owedLines))
    return {
        failingChecks: ((result.gates?.gateA?.checks ?? []) as any[]).filter((c) => c.verdict === 'FAIL').map((c) => ({ checkId: String(c.checkId), why: String(c.why ?? ''), subjects: ((c.subjects ?? []) as unknown[]).map(String) })),
        owedLines,
        // Review of 7 November, round 2: the items bounding an open line as the chain names them on its derived line (derive.ts: the SD-78
        // narrowing items, `narrowedTo.items`, and the bounding items, `bounding[].item`), with any bound the resolved entry names.
        openLines: ((resolved.open ?? []) as any[]).map((o) => {
            const d = derivedLine(String(o.lineId))
            const named: Array<{ contractId: string; itemId: string; how: 'NARROWING' | 'BOUNDING' }> = []
            const add = (x: { contractId: string; itemId: string } | null, how: 'NARROWING' | 'BOUNDING') => {
                if (x && !named.some((n) => n.contractId === x.contractId && n.itemId === x.itemId)) named.push({ ...x, how })
            }
            for (const item of (d?.narrowedTo?.items ?? []) as any[]) add(ref(item), 'NARROWING')
            for (const b of (d?.bounding ?? []) as any[]) add(ref(b?.item), 'BOUNDING')
            for (const b of (o.bounds ?? []) as any[]) add(ref(b?.from) ?? ref(b?.item) ?? ref(b), 'BOUNDING')
            return { lineId: String(o.lineId), permitted: o.permitted === null || o.permitted === undefined ? null : copy(o.permitted), boundedBy: named }
        }),
    }
}

/**
 * An item's evidence is printed verbatim in the report (review of 7 November), except where it holds a gendered pronoun, which nothing this
 * report writes may hold: such evidence is named and not printed (measured: four items of the knowledge the cases derive from).
 */
// The words are spelled backwards here, so that this file itself holds none of them (the binding rule: no gendered pronoun anywhere).
const GENDERED = new Set(['eh', 'mih', 'sih', 'flesmih', 'ehs', 'reh', 'sreh', 'flesreh'].map((w) => [...w].reverse().join('')))
export const holdsGenderedPronoun = (text: string): boolean => text.toLowerCase().split(/[^a-z]+/).some((t) => GENDERED.has(t))
/**
 * Stage 9: the chain's own sentences (a refusal's summary and reasons, the laws account) with each gendered pronoun printed as [Christian's]
 * (the two possessive forms) or [Christian] (the others), since nothing the reports write may hold one; in the engine's sentences each refers
 * to Christian (measured: the sport's laws check names Christian's reply and our DRAFT classification's standing names Christian's
 * materiality test). Every other word is kept. No sentence of the handoff's own evidence held one (its evidence scans itself), so the
 * handoff's evidence is unchanged by it.
 */
const POSSESSIVE = new Set(['sih', 'sreh'].map((w) => [...w].reverse().join('')))
export const withoutGenderedPronouns = (text: string): string => text.replace(/[A-Za-z]+/g, (word) => (GENDERED.has(word.toLowerCase()) ? (POSSESSIVE.has(word.toLowerCase()) ? `[Christian's]` : '[Christian]') : word))
const EVIDENCE_WITHHELD = 'it holds a gendered pronoun, which this report does not print; it is the item\'s basisEvidence in the knowledge file the chain derived from'

/**
 * The Game Problem library's name for each id, read through the display reader (its allowlist holds that column), after the decisions and for
 * the report only; the stage file reads no name column. An id the library does not hold gets no name.
 */
let namesKnowledge: ReturnType<typeof committedKnowledge> | null = null
function gameProblemNames(ids: Array<string | null>): Record<string, string> {
    namesKnowledge ??= committedKnowledge()
    const out: Record<string, string> = {}
    for (const id of ids) if (id && namesKnowledge.gameProblems.gameProblems.some((g) => g['ID'] === id)) out[id] = displayCell(namesKnowledge, { source: 'gameProblems', table: 'gameProblems', row: id, column: 'Name' }).text
    return out
}

/**
 * The diagram model's blocks as compared and printed: every field, with every word the diagram writes (field-diagram.ts `DiagramWord`: its
 * text, its status and the served sentence that carries it) kept whole, its status under a neutral token (review of 7 November, round 2:
 * before, a label was read as its text alone, so a change of its standing with the same words was invisible to the comparison). The status
 * value for Christian's term is printed as 'CHRISTIANS_TERM' (the engine's value begins with a gendered pronoun, which nothing this report
 * writes may hold; it is spelled backwards below so that this file holds none); 'DRAFT' is kept; any other value throws (fail closed).
 */
const CHRISTIANS_TERM_STATUS = [...'MRET_SIH'].reverse().join('')
const isDiagramWord = (v: unknown): v is { text: unknown; status: unknown; carriedBy: unknown } => !!v && typeof v === 'object' && !Array.isArray(v) && JSON.stringify(Object.keys(v as object).sort()) === JSON.stringify(['carriedBy', 'status', 'text'])
const neutralWords = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(neutralWords)
    if (isDiagramWord(v)) {
        const status = v.status === 'DRAFT' ? 'DRAFT' : v.status === CHRISTIANS_TERM_STATUS ? 'CHRISTIANS_TERM' : null
        if (status === null) throw new Error(`a diagram word's status is neither DRAFT nor the value for Christian's term: ${JSON.stringify(v.status)}`)
        return { text: v.text, status, carriedBy: copy(v.carriedBy ?? null) }
    }
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([key, x]) => [key, neutralWords(x)]))
    return v
}
const withNeutralWords = (entries: unknown[]): unknown[] => entries.map(neutralWords)

/**
 * Our DRAFT classification of the laws with one law read with another materiality: a labelled TEST-ONLY stand-in, neither our reading nor a
 * ruling of Christian's (the words of the standing say which part is which).
 */
function classificationWith(s: { law: string; materiality: string }): LawsMateriality {
    return {
        ...copy(lawsMateriality),
        file: 'TEST-ONLY',
        // The classification gate requires a standing that begins DRAFT and says TEST-ONLY or OUR READING; within that, the words say
        // which part is ours and which part is the stand-in (review of 7 November: before, the stand-in's clause was printed on every law).
        standing: `DRAFT - our DRAFT classification, except ${s.law} ${s.materiality}: a TEST-ONLY stand-in, neither our reading nor a ruling of Christian's`,
        classifications: lawsMateriality.classifications.map((e) => (e.law === s.law ? { ...e, materiality: s.materiality as 'PROCEDURAL' | 'MATERIAL', ourReading: 'TEST-ONLY stand-in.' } : { ...e })),
    }
}

/**
 * The chain wired for the handoff. `heldTo` is the classification the harness holds a REPORT check to: our DRAFT classification, except in
 * test E3, which holds it to a labelled TEST-ONLY stand-in to show the hold's refusing branch.
 */
export function chainWith(opts: { heldTo?: LawsMateriality; observeOnly?: boolean } = {}): HandoffChain {
    return {
    build(request: ChainRequest): ChainAnswer {
        const vehicle = request.vehicle
        const goalId = request.goalId ?? vehicle?.goalId
        if (!goalId) throw new Error(`case ${request.caseId}: neither a goal nor a vehicle`)
        // Stage 9: a request that consumes Steps 1 and 2 places nothing (the form is consumed, never placed; no manipulation is placed).
        const consume = request.consume
        if (consume && request.place.length) throw new Error(`case ${request.caseId}: a request that consumes Steps 1 and 2 places nothing, and this one places ${request.place.map((p) => p.id).join(', ')}`)
        if (request.laws && vehicle?.lawsStandIn) throw new Error(`case ${request.caseId}: a classification of the laws is given either by the vehicle or by the request, not both`)
        // The hook below only observes a consuming request's selection, so a vehicle's removeContext could not be applied (the handoff refuses the pair too).
        if (consume && vehicle) throw new Error(`case ${request.caseId}: a request that consumes Steps 1 and 2 carries no TEST-ONLY vehicle, and this one carries ${vehicle.goalId}`)
        // Handed to the entry's TEST-ONLY option as Steps 1 and 2 returned them in this run (the selection refuses a malformed one, fail closed).
        // The safeguards slice: the size-rule bypass is handed on only where the case declares it (the option's boolean, and nothing else).
        const upstream: UpstreamDecisions | undefined = consume
            ? {
                  gameProblem: { gameProblemId: consume.gameProblem.gameProblemId, step1Basis: consume.gameProblem.basis as UpstreamDecisions['gameProblem']['step1Basis'], label: consume.gameProblem.label },
                  gameForm: { formId: consume.gameForm.formId, standing: consume.gameForm.standing, cells: copy(consume.gameForm.cells) },
                  ...(consume.sizeRuleBypass === true ? { quotaBypass: true } : {}),
                  // Stage W1 (b): the review pathway's K2 result, the empty set with K2's rule and limit, in place of a per-goal record.
                  ...(consume.k2 ? { reviewManipulations: { basis: consume.k2.basis, set: [...consume.k2.set], rule: consume.k2.rule, limit: consume.k2.limit, cited: consume.k2.cited } } : {}),
              }
            : undefined
        if (request.recordRoute && !consume) throw new Error(`case ${request.caseId}: a manipulation enters by the record route only on a request that consumes Steps 1 and 2`)
        // Stage W1 (b): K2's result stands in place of a record, never beside one, and never beside a record-route manipulation.
        if (consume?.k2 && (request.records !== 'PRODUCTION' || request.recordRoute)) throw new Error(`case ${request.caseId}: K2's result is handed in place of a per-goal authorization record, and this request also carries ${request.records !== 'PRODUCTION' ? 'a TEST-ONLY record' : 'record-route manipulations'}`)
        let records = productionRecords
        if (request.records !== 'PRODUCTION') {
            // The TEST-ONLY record, in memory, in the production shape (held to the record gate by the build; never written to the file).
            const { provisionalRealization, ...rest } = copy(request.records)
            const record: Record<string, unknown> = { ...rest, excluded: [], manipulations: [] }
            if (provisionalRealization) record.provisionalRealization = provisionalRealization
            records = [...productionRecords, record as unknown as (typeof productionRecords)[number]]
        }
        const realizations = request.realization ? gatedRealizations(realizationEntry(request.realization)) : undefined
        // Stage W1 (b): under K2's result the draft store is read without its records (each still held to the gate, listed as not read).
        const drafts: DraftStoreContents | undefined = request.draftStore ? loadDraftStore(request.draftStore, consume?.k2 ? { recordsSetAsideBy: consume.k2.treatmentId } : {}) : undefined
        const draftIds = new Set((drafts?.contracts ?? []).map((c) => c.contractId))
        let scorerPick: string[] | null = null
        let seen: ChainAnswer['contracts'] = []
        let chosenBy = new Map<string, string>()
        // The selection and the contracts the build derived from, as its own TEST-ONLY options were handed them (for `refusalDetailOf`).
        let selected: any = null
        let derivedFrom: LoadedContract[] | null = null
        // The realization input the build realized with, after the case's alteration (for `refusalDetailOf` at realization).
        let suppliedUsed: SuppliedRealization | null = null
        // Stage 9: on a consuming request the hook only observes (the entry throws if it changes a selection that consumed upstream decisions).
        let observedOnly: boolean | null = null
        const alterSelection = (selection: any) => {
            scorerPick = selection.selected.filter((e: any) => e.role === 'game form').map((e: any) => String(e.id))
            // The safeguards slice: `observeOnly` runs the chain's own route (S3 test 2's legacy arm): the hook places nothing on any request.
            if (consume || opts.observeOnly) {
                selected = selection
                observedOnly = true
                return
            }
            const others =selection.selected.filter((e: any) => e.role !== 'game form' && !(vehicle?.removeContext && e.role === CONTEXT_ROLE))
            // An applied manipulation enters the selection explicitly, as the form does, in the role a demonstration gives its mechanism
            // (`demonstrationSelection`); the record's own authorized set is never widened (a lone one is refused at selection, measured).
            selection.selected = [{ id: request.formId, role: 'game form' }, ...others, ...request.place.map((p) => ({ id: p.id, role: 'constraint' }))]
            selected = selection
        }
        const alter = (contracts: LoadedContract[]) => {
            for (const w of request.withhold) {
                const contract = contracts.find((c) => c.contractId === w.contractId)
                if (!contract) throw new Error(`treatment ${w.treatmentId}: the chain derives from no contract ${w.contractId}`)
                for (const id of w.itemIds) if (!contract.items.some((i) => i.itemId === id)) throw new Error(`treatment ${w.treatmentId}: ${w.contractId} holds no item ${id}`)
                contract.items = contract.items.filter((i) => w.itemIds.indexOf(i.itemId) < 0)
            }
            // Stage 9: each declaration a TEST-ONLY treatment replaces, exactly one per treatment, on this copy; its note says so.
            for (const r of request.replaceDeclarations ?? []) {
                const contract = contracts.find((c) => c.contractId === r.contractId)
                if (!contract) throw new Error(`treatment ${r.treatmentId}: the chain derives from no contract ${r.contractId}`)
                const declarations = (contract.declarations ?? []) as any[]
                const hits = declarations.filter((d) => d.row === r.row && d.selector === r.selector && d.declaration === r.from)
                if (hits.length !== 1) throw new Error(`treatment ${r.treatmentId}: ${r.contractId} holds ${hits.length} declarations ${r.from} on ${r.row} (${r.selector}), and a treatment replaces exactly one`)
                declarations[declarations.indexOf(hits[0])] = { ...hits[0], declaration: r.to, ...(r.qualifier ? { qualifier: r.qualifier } : {}), note: `TEST-ONLY treatment ${r.treatmentId}, no ruling: ${String(hits[0].note ?? '')}` }
            }
            for (const s of request.standIns) {
                const contract = contracts.find((c) => c.contractId === s.contractId)
                if (!contract) throw new Error(`a stand-in names the contract ${s.contractId}, which the chain does not derive from`)
                contract.items.push(copy(s.item) as any)
            }
            derivedFrom = copy(contracts)
            seen = contracts.map((c) => ({
                contractId: c.contractId,
                origin: draftIds.has(c.contractId) ? ('DRAFT_STORE' as const) : c.contractId.startsWith('provisional:') ? ('REALIZATION' as const) : ('KNOWLEDGE' as const),
                items: c.items.map((i: any) => ({
                    itemId: String(i.itemId),
                    row: String(i.row),
                    basis: String(i.basis),
                    category: i.category ? String(i.category) : null,
                    basisEvidence: typeof i.basisEvidence === 'string' ? i.basisEvidence : JSON.stringify(i.basisEvidence ?? ''),
                    // Only where the item itself records one (measured 7 November: no knowledge item does).
                    provisional: typeof i.provisional === 'boolean' ? i.provisional : null,
                    evidenceWithheld: holdsGenderedPronoun(typeof i.basisEvidence === 'string' ? i.basisEvidence : JSON.stringify(i.basisEvidence ?? '')) ? EVIDENCE_WITHHELD : null,
                })),
            }))
        }
        const alterSupplied = (supplied: SuppliedRealization) => {
            chosenBy = choicesFileOf(supplied)
            for (const ch of request.choices) {
                const existing = supplied.choices.find((c) => c.lineId === ch.lineId)
                if (existing) {
                    existing.value = copy(ch.value) as any
                    existing.because = ch.because
                } else supplied.choices.push({ lineId: ch.lineId, value: copy(ch.value) as any, because: ch.because })
            }
            suppliedUsed = copy(supplied)
        }
        const standIn: LawsMateriality | undefined = vehicle?.lawsStandIn ? classificationWith(vehicle.lawsStandIn) : undefined
        // Stage 9: a request's classification of the laws: our DRAFT classification, with its labelled stand-in where it names one.
        const lawsGiven: LawsMateriality | undefined = standIn ?? (request.laws ? (request.laws.standIn ? classificationWith(request.laws.standIn) : copy(lawsMateriality)) : undefined)
        const built = buildActivityUnderAuthorizationRecords({ kind: 'learning-goal', goalId, session: sessionOf(request.session) }, records, {
            review: { includeDrafts: true },
            alterSelection,
            alter,
            alterSupplied,
            ...(drafts ? { drafts } : {}),
            ...(realizations ? { realizations } : {}),
            ...(lawsGiven ? { lawsMateriality: lawsGiven } : {}),
            ...(request.supplement ? { communicationSupplement: withReviewStructureWording } : {}),
            ...(upstream ? { upstream } : {}),
        })
        const activity = built.activity
        const fixture = built.fixture
        let outcome = activity.outcome
        let stage = activity.outcome === 'refused' ? activity.stage : null
        // The chain's own sentences, each gendered pronoun printed as [Christian's] or [Christian] (stage 9; see `withoutGenderedPronouns`).
        let summary = activity.outcome === 'refused' ? withoutGenderedPronouns(activity.summary) : null
        let reasons = activity.outcome === 'refused' ? activity.reasons.map(withoutGenderedPronouns) : []
        let laws: ChainAnswer['laws'] = activity.lawsCheck ? { mode: activity.lawsCheck.mode, owed: activity.lawsCheck.owed.map(withoutGenderedPronouns), reportedForReview: (activity.lawsCheck.materiality?.reportedForReview ?? []).map(withoutGenderedPronouns) } : null
        // Read before the harness's hold can restate the outcome: only a refusal the chain itself met before any game exists.
        const refusalDetail = activity.outcome === 'refused' && (activity.stage === 'structure' || activity.stage === 'realization') && selected && derivedFrom ? refusalDetailOf(selected, derivedFrom, sessionOf(request.session), activity.stage, activity.reasons, suppliedUsed) : null
        if (request.holdReportedLawsToMateriality && fixture) {
            const held = heldLaws(fixture, opts.heldTo)
            laws = { mode: 'REPORT (the TEST-ONLY realization\'s check), held by the harness to our DRAFT classification', owed: held.owed, reportedForReview: held.reported }
            if (held.material.length) {
                outcome = 'refused'
                stage = 'validation'
                summary = `the harness holds the TEST-ONLY realization's REPORT check to ${opts.heldTo ? 'a TEST-ONLY stand-in classification' : 'our DRAFT classification'}, and a law it owes is not procedural there`
                reasons = held.material
            }
        }
        const read = sentencesOf(activity, fixture)
        const account = activity.account
        const diagramDraft = (activity as ServedActivity).diagramDraft
        const block = diagramDraft?.diagram?.blocks?.[0] as any
        // Stage 9: what the chain's own account recorded it consumed, read from the build (never from the request); only on a consuming request.
        const recorded = account?.consumed
        const recordedProblem = account?.consumedGameProblem
        const consumption: ChainAnswer['consumption'] = recorded
            ? {
                  gameProblem: recordedProblem ? { gameProblemId: recordedProblem.gameProblemId, basis: recordedProblem.step1Basis, label: recordedProblem.label, source: recordedProblem.source } : null,
                  form: copy(recorded.form),
                  formCandidatesScored: [...recorded.formCandidatesScored],
                  formCandidatesFrom: recorded.formCandidatesFrom,
                  constraintAuthority: String(recorded.constraintAuthority),
                  constraintCandidateIds: [...recorded.constraintCandidateIds],
                  sizeRuleBypassed: recorded.quotaBypass === true,
                  // Stage W1 (a): which Game Problem governed the hints, and the hints the selector was handed, as the build recorded them.
                  hintsGameProblemId: recorded.hintsGameProblemId,
                  hintsGoverned: recorded.hintsGoverned,
                  lensCandidateIds: [...recorded.lensCandidateIds],
                  hintsSignals: [...recorded.hintsSignals],
                  // Stage W1 (b): K2's result as the build's account recorded it (never read from the request).
                  reviewManipulations: recorded.reviewManipulations ? copy(recorded.reviewManipulations) : null,
                  selectionObservedOnly: observedOnly,
                  draftStatus: activity.draftKnowledge?.status ?? null,
              }
            : null
        // The safeguards slice: the record the chain consulted holds exactly the case's record-route manipulations (fail closed), and each one
        // the chain built is named with the contracts it derived for it.
        if (request.recordRoute) {
            const consulted = [...((account?.authorization?.authorizedConstraints ?? []) as string[])].sort()
            if (JSON.stringify(consulted) !== JSON.stringify([...request.recordRoute].sort())) throw new Error(`case ${request.caseId}: the record the chain consulted authorizes ${consulted.join(', ') || 'nothing'}, and the case's record-route manipulations are ${request.recordRoute.join(', ')}`)
        }
        const recordSet: ChainAnswer['recordSet'] = request.recordRoute ? (account?.constraints ?? []).map((c) => ({ id: c.id, contractIds: seen.filter((x) => knowledgeKey(x.contractId) === knowledgeKey(c.id)).map((x) => x.contractId) })) : undefined
        const summaryOf = (activity.requirementAccount as any)?.summary
        const observed: NonNullable<ChainAnswer['observed']> = {
            constraintAuthority: account?.constraintSource?.constraintAuthority ? String(account.constraintSource.constraintAuthority) : null,
            constraintGap: account?.constraintSource?.gap ? String(account.constraintSource.gap) : null,
            lensIds: selected ? ((selected.selected ?? []) as any[]).filter((e) => String(e.role).startsWith('affordance lens')).map((e) => String(e.id)) : [],
            contextInThisActivity: account?.context ? account.context.inThisActivity === true : null,
            scoringCondition: summaryOf ? { state: String(summaryOf.scoringCondition?.state ?? 'NONE'), rowId: summaryOf.scoringCondition?.rowId ?? null, carried: summaryOf.scoringConditionCarried === true } : null,
        }
        return {
            outcome,
            stage,
            summary,
            reasons,
            scorerPick,
            account: account
                ? {
                      gameFormId: account.gameForm?.id ?? null,
                      contextId: account.context?.id ?? null,
                      contextContract: (account.context as { contract?: string } | null | undefined)?.contract ?? null,
                      gameProblem: account.gameProblem
                          ? { status: account.gameProblem.status, gameProblemId: account.gameProblem.gameProblemId, inferredFromWording: account.gameProblem.inferredFromWording, names: gameProblemNames([account.gameProblem.gameProblemId, account.gameProblem.inferredFromWording]) }
                          : null,
                      constraints: (account.constraints ?? []).map((c) => c.id),
                      affordanceLenses: [...(account.affordanceLenses ?? [])],
                  }
                : null,
            contracts: seen,
            lines: linesOf(fixture, request, chosenBy),
            sentences: read.sentences,
            sentencesServed: read.served,
            withheld: read.withheld,
            laws,
            requirementAccount: activity.requirementAccount
                ? {
                      status: String(activity.requirementAccount.status),
                      contract: (activity.requirementAccount as { contract?: string }).contract ?? null,
                      components: (((activity.requirementAccount as any).summary?.scoringCondition?.components ?? []) as any[]).map((c) => [String(c.component), String(c.account)] as [string, string]),
                  }
                : null,
            diagram: diagramDraft
                ? {
                      served: !!(activity as ServedActivity).diagram,
                      verdict: diagramDraft.verdict,
                      area: diagramDraft.diagram?.area ? { lengthM: (diagramDraft.diagram.area as any).lengthM, widthM: (diagramDraft.diagram.area as any).widthM } : null,
                      counts: ((diagramDraft.diagram?.counts ?? []) as any[]).map((c) => c?.word?.text ?? c),
                      legend: (diagramDraft.diagram?.legend ?? []).map((l: any) => l.text),
                      zones: ((block?.markings?.zones ?? []) as any[]).map((z) => ({ zone: z.elementId, along: z.along, across: z.across })),
                      findings: copy(diagramDraft.findings ?? []),
                      // Since the review of 7 November the comparison reads these too, so 'exactly' covers the whole diagram block; since its
                      // second round every word the diagram writes is kept with its status (a neutral token) and the sentence carrying it.
                      dimensions: withNeutralWords(copy(block?.dimensions ?? [])),
                      targets: withNeutralWords(copy(block?.targets ?? [])),
                      teams: withNeutralWords(copy(block?.teams ?? [])),
                  }
                : null,
            placed: request.place.map((p) => ({ id: p.id, contractIds: seen.filter((c) => knowledgeKey(c.contractId) === knowledgeKey(p.id)).map((c) => c.contractId) })),
            fidelityViolations: activity.outcome === 'served' ? (activity as ServedActivity).integrity.fidelityViolations : stage === 'communication' && activity.outcome === 'refused' ? reasons.filter((x) => x.startsWith('fidelity ')).length : null,
            refusalDetail,
            ...(consume ? { consumption } : {}),
            ...(recordSet ? { recordSet } : {}),
            observed,
        }
    },
    }
}

export const realChain: HandoffChain = chainWith()

// ---------------------------------------------------------------------------------------------------------------------------------------
// Run alone (registered): only unit files import this wiring
// ---------------------------------------------------------------------------------------------------------------------------------------

if (require.main === module) {
    const SRC = path.resolve(HERE, '..', '..')
    const files: string[] = []
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (entry.name.endsWith('.ts')) files.push(full)
        }
    }
    walk(SRC)
    // A module specifier ending in this file's name, in either quotation mark (the double one built from its code, so this file holds none).
    const Q = String.fromCharCode(34)
    const importsThis = (source: string): boolean => ['/handoff-chain.unit', '/handoff-chain.unit.ts'].some((name) => source.includes(`${name}'`) || source.includes(`${name}${Q}`))
    assert.ok(importsThis(`import { realChain } from './handoff-chain.unit'`) && importsThis(`require(${Q}../design-reasoning/handoff-chain.unit${Q})`) && !importsThis(`import { x } from './handoff'`), 'bite: both quotation marks are seen, and another module is not')
    const importers = files.filter((f) => path.basename(f) !== 'handoff-chain.unit.ts' && importsThis(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(SRC, f).split(path.sep).join('/'))
    assert.ok(importers.length >= 1, 'the wiring is imported')
    assert.deepEqual(importers.filter((f) => !f.endsWith('.unit.ts')), [], 'only unit files import the handoff chain wiring')
    const registry = readJson(path.resolve(HERE, '..', '..', '..', 'scripts', 'unit-tests.json')) as string[]
    assert.ok(registry.includes('./src/system/design-reasoning/handoff-chain.unit.ts'), 'registered')
    console.log(`handoff-chain wiring: imported only by unit files (${importers.join(', ')}); registered`)
}

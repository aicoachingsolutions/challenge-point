/**
 * Derivation engine — the real contract corpus as an input.
 *
 * The stage-B conformance work restated eight knowledge objects as contracts. This module adapts that
 * file into `DerivationInput` **without repairing any of it**: the only transformation is the field
 * name `id` → `itemId`, because the corpus predates the record names. Every defect the corpus carries
 * — the mojibake glyph, the unregistered attributes, the missing modifier operations — reaches the
 * engine intact and is refused there, which is the point.
 *
 * His rule, 22 September: "Do not repair knowledge merely to make implementation tests pass."
 *
 * The figures a run produces are asserted in the increment tests, so the numbers quoted in any report
 * are reproducible from the repository rather than from a script that no longer exists.
 */

import fs from 'node:fs'
import path from 'node:path'

import { ContractItem, DerivationInput, LoadedContract, ROLE_YIELD_KEY } from './types'
import { repairCorpusEncoding, RepairTally } from './corpus-repair'
import { applyNoRowRestatement, RestatementTally } from './corpus-restatement'
import { AUDITS_DIR } from './knowledge-root'
import { objectPositionRefusal, ObjectPositionRows } from './object-extent'
import { designationName, indexRegister } from './register'

export const CONFORMANCE_DIR = path.join(AUDITS_DIR, 'conformance')

/** The BOM the register file carries; stripping it is a file-encoding concern, not a repair. */
export function readJson(file: string): any {
    return JSON.parse(fs.readFileSync(path.join(CONFORMANCE_DIR, file), 'utf8').replace(/^﻿/, ''))
}

export function loadRegister(): any {
    return readJson('register-2026-09-18.json')
}

/**
 * The envelope the stage-B derivations worked to. It is a session input, not knowledge: no contract
 * authors it, and SD-33 makes the session the authority for these four rows.
 */
/**
 * `roles` added 1 October on his ruling, and the wording of it matters: *"This is a session fact for
 * this run, not a default assumption that Challenge Point sessions contain no goalkeepers."*
 *
 * An explicit zero, not an omission — an absent entry means NOT STATED, so only a stated zero lets the
 * roster derive without implying that every available performer is an outfield player.
 */
function statedRoles(): Record<string, number> {
    // Keyed by whatever the register names as a specialized role, so no role name is written here.
    // Zero for each, which is a stated fact about this run rather than a default about sessions.
    const rows = (loadRegister().rows || []) as any[]
    return Object.fromEntries(rows.filter(r => r?.specializedRole).map(r => [String(r.path).split('.').pop() as string, 0]))
}

export const CORPUS_ENVELOPE = { players: 12, lengthM: 40, widthM: 30, durationMin: 20, roles: statedRoles() }

/**
 * The corpus names objects in prose, sometimes carrying the library code in brackets. Ids reach the
 * emitted line ids, so the rule is explicit and stable: a bracketed code, else a leading code token
 * carrying a digit, else the name slugged. It invents no knowledge — only a stable handle.
 */
function objectIdOf(name: string, index: number): string {
    const text = String(name || '').trim()
    const bracketed = text.match(/\(([A-Z][A-Z0-9-]*)\)/)
    if (bracketed) return bracketed[1]
    const leading = text.match(/^([A-Z][A-Z0-9-]*\d[A-Z0-9-]*)\b/)
    if (leading) return leading[1]
    const slug = text.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase()
    return slug || `OBJ-${index}`
}

/**
 * Repair phase A — **encoding only**. The original artefact is never modified; the repair is applied on
 * load and counted, so every run states how much of what it read was repaired. Restatement and new
 * authoring are not done here: they need a semantic decision that is his.
 */
export const repairTally: RepairTally = { strings: 0, charactersRecovered: 0 }

/** Restatement is counted separately from encoding repair: they are different kinds of change. */
export const restatementTally: RestatementTally = { applied: 0, withheld: [], itemsRestated: 0, itemsRemoved: 0, itemsAdded: 0, declarationScopes: 0, declarationsRestated: 0, declarationsAdded: 0, declarationsAddedOnDeclaredRows: 0, notFound: [] }

export function loadCorpusContracts(): LoadedContract[] {
    repairTally.strings = 0
    repairTally.charactersRecovered = 0
    const raw = repairCorpusEncoding(readJson('stage-b/contracts.json'), repairTally)
    const entries: any[] = Array.isArray(raw) ? raw : Object.values(raw)

    const adapted = entries.map((entry, index) => {
        const result = entry.result || {}
        const objectId = objectIdOf(entry.name, index)
        const items: ContractItem[] = (result.items || []).map((item: any) => {
            const { id, ...rest } = item
            return { itemId: String(id), ...rest } as ContractItem
        })

        return {
            contractId: `${entry.kind}:${objectId}`,
            objectId,
            knowledgeVersion: 'stage-b',
            items,
            declarations: result.declarations || [],
            relationshipRules: result.relationshipRules || [],
        }
    })

    // Phase A, second kind: the one restatement he has ruled. Applied after the encoding repair, because
    // one of the two unregistered spellings is an em dash that only exists once the encoding is restored.
    return applyNoRowRestatement(adapted, restatementTally)
}

/**
 * **The Sport Profile — constitutive sport structure, not selected knowledge.**
 *
 * Authorized by Christian on 6 October, after the bounded carrier sweep established that the ball is the only
 * sport-level carrier any currently selected game rule requires. The layer was named before it existed: the game
 * archetype workbook's own `Sport_Profile_Rule` says *"Detailed sport-specific logic is excluded and must inherit
 * through separate Sport Profile resources."*
 *
 * **Why it is loaded separately from the corpus rather than added to it.** `contracts.json` holds the eight
 * restated knowledge objects a goal SELECTS from, each frozen against the 81-row roster of its restatement. A
 * Sport Profile is selected by nobody — it is the environment every activity of this sport runs in — so it reaches
 * every derivation unconditionally. Putting it in the corpus file would make it look selectable and would put a
 * post-freeze contribution inside a frozen set.
 *
 * **It uses no new mechanism.** It is an ordinary contribution contract, and §6 already rules that shape for a
 * source outside the representation needing a structural property inside it: *"it enters as a `SELECTION` item
 * under its own contract (SD-17), with no separate route into the game or its language."* Its items are graded by
 * exactly the same rules as any other, which is the point — `OWNER_RULING` establishes an element because
 * `establishesExistence` admits it, not because this file is special.
 *
 * **The engine does not name the sport, and the discovery rule is the reason.** The profile is found by pattern in
 * the knowledge directory, so the sport's identity lives in the artefact — in its filename and its own `sportId`
 * field — and never in this sport-neutral module. Writing the filename here would have put a sport inside the
 * engine, which is the coupling the sport-coupling ratchet exists to catch; it did catch it, on the first run.
 *
 * Absence and plurality both raise rather than resolve quietly. A derivation with no sport is not a game, so an
 * empty directory must not hand back an empty list and let the ball disappear silently. Two profiles are a choice
 * of sport, and the engine is not entitled to make it by sort order.
 */
function sportProfileFiles(): string[] {
    const dir = path.join(CONFORMANCE_DIR, 'stage-b')
    const found = fs
        .readdirSync(dir)
        .filter(name => /^sport-profile-.+\.json$/.test(name))
        .sort()
    if (!found.length) throw new Error(`no Sport Profile in ${dir}: the sport a game is played in is constitutive, so there is nothing to derive`)
    if (found.length > 1) throw new Error(`${found.length} Sport Profiles in ${dir} (${found.join(', ')}): which sport a game is played in is a decision, not a sort order`)
    return found.map(name => `stage-b/${name}`)
}

/**
 * **The role-yield marker is a ruled item restatement's alone** — stage A review fix, 22 October 2026. GA-ROLE-EVENTS clause 6 trusts
 * the marker wherever it finds it, so a loader of anything a ruling does not restate (the Sport Profile, a provisional realization)
 * refuses an item carrying it, named, rather than let a REQUIRED item yield on nobody's ruling. Christian, reply filed 25 October 2026,
 * item 2: *"preserving structural validation and knowledge authorization."* The corpus's own items and the items a ruling adds are
 * refused in the restatement loader (`unruledRoleYieldRefusal`). Empty where no item carries it.
 */
export function roleYieldMarkerRefusals(items: unknown, where: string): string[] {
    return (Array.isArray(items) ? items : [])
        .filter(item => !!item && typeof item === 'object' && ROLE_YIELD_KEY in item)
        .map(item => `${where} item ${String(item.id ?? item.itemId ?? '(no id)')} carries the role-yield marker, which only a ruled item restatement quoting his words writes`)
}

/**
 * **No placeholder extent for an object, and no supersession, in a provisional realization** — stage B, 23 October 2026 (register version
 * 17, `objectGeometry`). Christian, reply filed 25 October 2026, item 3: *"Goal dimensions and suitability should be determined through
 * approved [sport] knowledge and available equipment. Please identify any missing knowledge decisions needed here rather than inventing
 * dimensions or treating every goal as interchangeable."* So on an object's along or across position a provisional realization may write
 * only what `objectPositionRefusal` (object-extent.ts) admits - an ALLOWLIST since the stage B review fix: a position on a team's end line with
 * no depth, or a centred term on its own axis (whose extent comes from the width the session states or a REQUIRED extent, and which refuses
 * without one). Everything else is refused, named: an extent in metres, a depth from an end line, a fraction-of-axis term ("full extent",
 * "bounded minority": measured in the review placing an object across the whole width, or 40 m deep), a phrase, a relative position, or a
 * centred term on the other axis. And a provisional realization holds his choices, never a supersession or a pairing (`defersTo`,
 * `defersWith`), which only a ruled restatement writes (the deferral honours both wherever it finds them). Empty where nothing is refused; no
 * production item is.
 */
export function placeholderExtentRefusals(items: unknown, where: string, objectRows: ObjectPositionRows | null, terms: Record<string, any> = {}): string[] {
    const errors: string[] = []
    for (const item of Array.isArray(items) ? items : []) {
        if (!item || typeof item !== 'object') continue
        const at = `${where} item ${String(item.id ?? item.itemId ?? '(no id)')}`
        if ('defersTo' in item || 'defersWith' in item) errors.push(`${at} carries a supersession or a pairing (defersTo, defersWith), which only a ruled restatement writes`)
        const refused = objectPositionRefusal(String(item.row), item.value, objectRows, terms)
        if (refused) errors.push(`${at} ${refused}`)
    }
    return errors
}

/** The Sport Profile, as contracts. `read` is a parameter ONLY so a test can hand a copy through the same refusal; production passes none. */
export function loadSportProfile(read: (file: string) => any = readJson): LoadedContract[] {
    return sportProfileFiles().map(file => {
        const result = read(file).result || {}
        // Stage B review fix (23 October 2026): nor a supersession or a pairing, which only a ruled restatement writes; the deferral honours
        // both wherever it finds them, so the profile, which no restatement reaches, may carry neither. No profile item carries either.
        const refused = [
            ...roleYieldMarkerRefusals(result.items, `the Sport Profile ${file}`),
            ...(Array.isArray(result.items) ? result.items : [])
                .filter((item: any) => !!item && typeof item === 'object' && ('defersTo' in item || 'defersWith' in item))
                .map((item: any) => `the Sport Profile ${file} item ${String(item.id ?? item.itemId ?? '(no id)')} carries a supersession or a pairing (defersTo, defersWith), which only a ruled restatement writes`),
        ]
        if (refused.length) throw new Error(refused.join(' | '))
        return {
            contractId: String(result.object),
            objectId: String(result.object),
            knowledgeVersion: 'stage-b',
            items: (result.items || []).map((item: any) => {
                const { id, ...rest } = item
                return { itemId: String(id), ...rest } as ContractItem
            }),
            declarations: result.declarations || [],
            relationshipRules: result.relationshipRules || [],
        }
    })
}

/**
 * **The sport's coach vocabulary: its words for what a game already holds, never structure** — stage M4, 17 October 2026 (design
 * step L10). His reply filed 19 October 2026, item 4: *"I approve both of your proposed revisions:"* and his words on the first, a
 * restart method's noun (quoted in the file, which the coupling ratchet keeps out of this sport-neutral module). Found by pattern
 * beside the Sport Profile and tied to it by `sportId`, exactly as the profile is found (no sport named here); none is allowed (a
 * sport with no vocabulary yet says every method by its sport-neutral phrase), two are a choice of sport and refused. Every entry
 * must carry his approval (`approvedBy`, his words cited) and name the trigger and method it is the noun for, once; ANY defect
 * refuses the whole file, because a noun that slipped in unapproved would be said to every coach of the sport.
 */
export interface SportRestartMethodNoun {
    trigger: string
    method: string
    article: string
    noun: string
    approvedBy: { words: string; citedAs: string }[]
}

export interface SportCoachVocabulary {
    sportId: string
    file: string
    restartMethodNouns: SportRestartMethodNoun[]
}

/** Everything wrong with a sport's coach vocabulary, as sentences; empty means it may be loaded. `sportId` is the profile's. */
export function validateSportCoachVocabulary(raw: any, sportId: string | null): string[] {
    const errors: string[] = []
    const text = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0
    if (!raw || typeof raw !== 'object') return ['the vocabulary is not an object']
    if (raw.kind !== 'SPORT_COACH_VOCABULARY') errors.push(`its kind is ${JSON.stringify(raw.kind)}, not SPORT_COACH_VOCABULARY`)
    if (!text(raw.sportId) || raw.sportId !== sportId) errors.push(`it is for ${JSON.stringify(raw.sportId)}, and the Sport Profile is ${JSON.stringify(sportId)}`)
    const entries = raw.restartMethodNouns?.entries
    if (!Array.isArray(entries)) return [...errors, 'it holds no restartMethodNouns.entries list']
    const seen = new Set<string>()
    for (const [i, entry] of entries.entries()) {
        const which = `restart method noun ${i + 1}`
        if (!text(entry?.trigger) || !text(entry?.method)) errors.push(`${which} names no trigger and method`)
        if (!text(entry?.noun) || !text(entry?.article)) errors.push(`${which} has no noun or article`)
        const approval = entry?.approvedBy
        if (!Array.isArray(approval) || !approval.length || !approval.every((w: any) => text(w?.words) && text(w?.citedAs))) errors.push(`${which} carries no approval in his cited words`)
        // Stage M4 review (17 October 2026): the noun said to the coach must be one his cited words name, as an approved template
        // sentence must appear in its quote (approved-wording.ts) - an approval that names some other word approves nothing here.
        else if (text(entry?.noun) && !approval.some((w: any) => String(w.words).includes(String(entry.noun)))) errors.push(`${which}: the noun ${JSON.stringify(entry.noun)} is not in his cited words`)
        const key = `${entry?.trigger}|${entry?.method}`
        if (seen.has(key)) errors.push(`${which} repeats the trigger and method ${key}`)
        seen.add(key)
    }
    return errors
}

export function loadSportCoachVocabulary(): SportCoachVocabulary | null {
    const dir = path.join(CONFORMANCE_DIR, 'stage-b')
    const found = fs
        .readdirSync(dir)
        .filter(name => /^sport-coach-vocabulary-.+\.json$/.test(name))
        .sort()
    if (!found.length) return null
    if (found.length > 1) throw new Error(`${found.length} sport coach vocabularies in ${dir} (${found.join(', ')}): which sport's words a coach reads is a decision, not a sort order`)
    const file = `stage-b/${found[0]}`
    const raw = readJson(file)
    const sportId = sportProfileFiles().map(name => readJson(name).sportId).find(id => typeof id === 'string') ?? null
    const errors = validateSportCoachVocabulary(raw, sportId)
    if (errors.length) throw new Error(`${file} is refused: ${errors.join('; ')}`)
    return { sportId: String(raw.sportId), file, restartMethodNouns: JSON.parse(JSON.stringify(raw.restartMethodNouns.entries)) }
}

/**
 * **Provisional realizations — his provisional choices for one goal's activity, built like knowledge and never mistaken
 * for it.** Added 15 October 2026 (stage K2).
 *
 * Christian, reply filed 17 October 2026: *"The priority remains producing one complete, representative Play Out from the
 * Back activity through the normal generation pathway, without introducing unnecessary architecture or treating this first
 * realization as the canonical version of the Learning Goal."* His 16 October item 10 keeps the categories apart:
 * *"Provisional realization choices for the first activity. … Please keep those categories distinct."*
 *
 * **Why a contract and why not an existing home.** The engine can only build what reaches it as contract items, so a
 * choice that is to shape the game must be one; the Sport Profile is the precedent (SD-17), and no new mechanism grades
 * these items. But the existing homes each say the wrong thing: in `contracts.json` or a restatement the choice would be
 * canonical knowledge of the context for every activity; a realization-choices file cannot create structure (SD-16);
 * and the authorization record holds no values. So the items live in their own file, and three things keep them apart:
 *
 *   - **they join only where a record names them** (`derivationInputFor` reads `provisionalRealization` from the
 *     selected goal's record; nothing else selects them, and no goal is named in code);
 *   - **every item carries `category: PROVISIONAL_REALIZATION_CHOICE`**, which the resolved game copies onto each support
 *     entry the item gives (`resolved-game.ts`) and the fixture carries whole — the grading alone (OWNER_RULING) could
 *     not tell his choice for one activity from canonical knowledge;
 *   - **the loader refuses the WHOLE file** on any item without his words, without basis OWNER_RULING, without the
 *     category, colliding with a canonical item id, or naming a designation the file refuses (his D7: *"Please use the
 *     assigned team roles rather than referring generically to "the defending team,""*), and on ANY declaration. A
 *     provisional choice says what this activity does; a declaration says what knowledge does not constrain, and his M6
 *     admits an added non-claim only where it *"provably cannot contradict existing knowledge"* — so none enters here.
 *
 * Refused at load rather than per contract, because a malformed realization would silently decide what one goal's coach
 * is served, which is the authorization records' reason too (`learning-goal-authorizations.ts`). Returned as deep copies.
 */
export const PROVISIONAL_REALIZATION_CHOICE = 'PROVISIONAL_REALIZATION_CHOICE'
export const PROVISIONAL_REALIZATIONS_FILE = 'stage-b/provisional-realizations.json'

/** A practice situation a realization was not designed for, with why: the combination is refused, not built. */
export interface NotWithPracticeSituation {
    id: string
    basis: string
    because: string
}

/** A provisional realization as derivation receives it: a contribution contract, with what makes it provisional beside it. */
export interface ProvisionalRealization extends LoadedContract {
    provisionalId: string
    category: typeof PROVISIONAL_REALIZATION_CHOICE
    /** The context it realizes for one activity, and is never canonical knowledge of. */
    realizes: string
    ruledOn: string
    by: string
    citedAs: string
    words: string[]
    /** The realization-choices file (under docs/audits) whose declared entries replace the game form's, or null. */
    realizationChoices: string | null
    notWithPracticeSituations: NotWithPracticeSituation[]
    /**
     * **His testing boundaries for this realization, as data** (15 October 2026, stage K4) — reply filed 18 October 2026,
     * item 7: *"The 11–12-player support and 40 × 30 m prototype values are acceptable current testing boundaries, but they
     * should not become permanent architectural limitations."* The player counts the realization's own items admit, recorded
     * so a test can hold the roster's answer to them; nothing in code limits a count. Null where none is recorded.
     */
    testingBoundaries: TestingBoundaries | null
    /**
     * **The realization this one is composed from, where it is a variant** (stage E, 23 October 2026, the design's Stage E; his reply filed 25
     * October 2026, item 4: *"These should be alternative knowledge-authorized realizations, not separate hardcoded implementations of the
     * same Learning Goal."*). A variant states the realization it is `basedOn`, the base's items it `withdraws` (each with why) and its own
     * items; its items are the base's in their order without the withdrawn ones, then its own, composed once at load and held to an integrity
     * gate (`validateProvisionalRealizations`). Absent on a realization that is no variant, which holds exactly its own items, as before.
     */
    basedOn?: string
    withdrawn?: { itemId: string; because: string }[]
    /**
     * **What this realization's authorized knowledge says suits its objects of a kind** (stage E): a width range in metres per kind, each in
     * his cited words. Read only by the availability rule (`realization/assemble-concrete-game.ts` objectAvailabilityRefusal); where a
     * realization states none for a kind, no stated object of that kind suits it. Decision 4 of the note sent to him (goal suitability and
     * size) is his: no production realization carries one on 23 October 2026, and only TEST-ONLY copies do.
     */
    objectSuitability?: ObjectSuitability[]
}

/** What a realization's authorized knowledge says suits its objects of one kind (stage E): a width range in metres, in his cited words. */
export interface ObjectSuitability {
    kind: string
    widthM: { min: number | null; max: number | null }
    ruledOn: string
    by: string
    citedAs: string
    words: string[]
}

/** A realization's testing boundaries (stage K4): what its items should admit, in his words. */
export interface TestingBoundaries {
    players: number[]
    /**
     * **The areas the realization's metric starting values were given for** (15 October 2026, stage K6). His reply filed 18 October
     * 2026, item 3: *"The pressure reference should be adjustable in either direction. Twenty meters is our initial hypothesis, not a
     * canonical distance or a requirement for other field sizes."* Item 7: the 40 × 30 m prototype values are *"acceptable current
     * testing boundaries, but they should not become permanent architectural limitations."* Data, read by the builder
     * (`testingAreaRefusal`), never a limit in code. Absent where the realization holds no metric value.
     */
    areas?: { lengthM: number; widthM: number }[]
    words: string
    citedAs: string
    note: string | null
}

const filledText = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

/** The designation tokens a selector or value names: each run of upper-case letters, digits and underscores. */
const tokensOf = (value: unknown): string[] => (JSON.stringify(value ?? null).match(/[A-Z][A-Z0-9_]*/g) ?? [])

/**
 * Everything wrong with a provisional-realizations file, as sentences. Empty means it may be loaded. The lists it is
 * checked against are parameters so a test can hand it a damaged copy; production passes the corpus, the Sport Profile,
 * the register and the audits directory.
 */
export function validateProvisionalRealizations(
    file: any,
    canonicalItemIds: Set<string> = new Set([...loadCorpusContracts(), ...loadSportProfile()].flatMap(c => c.items.map(item => item.itemId))),
    // The list's entry names as the register module spells them (K2 review: one reading of the list, not a second copy).
    designationNames: Set<string> = new Set(((loadRegister().teamDesignations?.list ?? []) as string[]).map(designationName)),
    choicesFileExists: (name: string) => boolean = name => fs.existsSync(path.join(AUDITS_DIR, name)),
    // Stage B (23 October 2026): the object rows whose extents a placeholder may not fill (the register's objectGeometry), or null without them.
    objectRows: ObjectPositionRows | null = indexRegister(loadRegister()).objectGeometry,
    // Stage B review fix: the register's machine-readable relative terms, which say which centred term is on which axis.
    relativeTerms: Record<string, any> = loadRegister().relativeTerms?.machineReadable?.terms ?? {},
    // Stage E (23 October 2026): the object kinds a session states its availability of (the register's sessionResources), the only kinds a
    // realization's suitability may speak of.
    objectKinds: string[] = indexRegister(loadRegister()).sessionResources?.kinds ?? [],
): string[] {
    const errors: string[] = []
    if (!file || typeof file !== 'object' || !filledText(file.about)) errors.push('the file says nothing about what it is (about)')
    const refused = file?.refusedDesignations
    const refusedList: string[] = Array.isArray(refused?.designations) ? refused.designations.map(String) : []
    if (!refusedList.length || !filledText(refused?.words) || !filledText(refused?.citedAs)) errors.push('the refused designations must be listed with his words and where he said them')
    for (const name of refusedList) if (!designationNames.has(name)) errors.push(`the refused designation ${name} is not one the register defines`)
    const realizations: any[] = Array.isArray(file?.realizations) ? file.realizations : []
    if (!realizations.length) errors.push('the file holds no realization')
    const seen = new Set<string>()
    for (const [i, realization] of realizations.entries()) {
        const id = String(realization?.id ?? '')
        const which = `realization ${id || i + 1}`
        if (!filledText(realization?.id)) errors.push(`realization ${i + 1} has no id`)
        if (seen.has(id)) errors.push(`${which} is defined twice`)
        seen.add(id)
        if (realization?.contractId !== `provisional:${id}`) errors.push(`${which}: its contract id must be provisional:${id}`)
        if (realization?.category !== PROVISIONAL_REALIZATION_CHOICE) errors.push(`${which} is not labelled ${PROVISIONAL_REALIZATION_CHOICE}`)
        if (!filledText(realization?.realizes)) errors.push(`${which} names no context it realizes`)
        if (!filledText(realization?.ruledOn) || !filledText(realization?.by) || !filledText(realization?.citedAs)) errors.push(`${which} cites no ruling (ruledOn, by and citedAs are all required)`)
        if (!Array.isArray(realization?.words) || !realization.words.length || !realization.words.every(filledText)) errors.push(`${which} quotes none of his words`)
        if (realization?.realizationChoices !== null && realization?.realizationChoices !== undefined) {
            if (!filledText(realization.realizationChoices) || !choicesFileExists(String(realization.realizationChoices))) errors.push(`${which} names realization choices that do not exist: ${realization.realizationChoices}`)
        }
        for (const [j, situation] of (Array.isArray(realization?.notWithPracticeSituations) ? realization.notWithPracticeSituations : [null]).entries()) {
            if (situation === null) {
                errors.push(`${which} lists no practice situations it was not designed for (an empty list says it was designed for all)`)
                continue
            }
            if (!filledText(situation?.id) || !filledText(situation?.because) || !filledText(situation?.basis)) errors.push(`${which}: practice situation ${j + 1} must say which, why and on what basis`)
        }
        // His testing boundaries (stage K4), where recorded: whole player counts in his words. Data only.
        const boundaries = realization?.testingBoundaries
        if (boundaries !== undefined && boundaries !== null) {
            const counts = Array.isArray(boundaries.players) ? boundaries.players : []
            if (!counts.length || !counts.every((n: unknown) => Number.isInteger(n) && Number(n) > 0)) errors.push(`${which}: testingBoundaries.players must list whole player counts`)
            if (!filledText(boundaries.words) || !filledText(boundaries.citedAs)) errors.push(`${which}: testingBoundaries must quote him and say where`)
            // The areas its metric starting values were given for (stage K6, his 18 October item 3 and item 7), where recorded.
            if (boundaries.areas !== undefined) {
                const areas = Array.isArray(boundaries.areas) ? boundaries.areas : []
                const measured = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0
                if (!areas.length || !areas.every((area: any) => area && measured(area.lengthM) && measured(area.widthM))) errors.push(`${which}: testingBoundaries.areas must list areas, each with a length and a width in metres`)
            }
        }
        if (!Array.isArray(realization?.declarations) || realization.declarations.length) errors.push(`${which} holds a declaration; a provisional realization says what its activity does, never what knowledge does not constrain`)
        if (!Array.isArray(realization?.relationshipRules) || realization.relationshipRules.length) errors.push(`${which} holds a relationship rule, which no provisional realization has a reading for`)
        const items: any[] = Array.isArray(realization?.items) ? realization.items : []
        if (!Array.isArray(realization?.items)) errors.push(`${which} lists no items (an empty list says it holds none)`)
        // K2 review, 15 October 2026: one id, one item. A support entry and the review page's list cite an item by its
        // contract and id, so two items under one id would leave a provisional choice citing either of two statements.
        const itemIds = new Set<string>()
        for (const item of items) {
            const itemId = String(item?.id ?? '')
            const at = `${which} item ${itemId || '(no id)'}`
            if (itemId && itemIds.has(itemId)) errors.push(`${at} is defined twice`)
            itemIds.add(itemId)
            if (!filledText(item?.id) || !itemId.startsWith(`${id}-`)) errors.push(`${at}: an item's id must begin ${id}-`)
            if (canonicalItemIds.has(itemId)) errors.push(`${at} collides with a canonical item id`)
            if (item?.basis !== 'OWNER_RULING') errors.push(`${at} is not OWNER_RULING: a provisional realization holds only his choices`)
            if (item?.category !== PROVISIONAL_REALIZATION_CHOICE) errors.push(`${at} is not labelled ${PROVISIONAL_REALIZATION_CHOICE}`)
            if (!filledText(item?.words) || !filledText(item?.citedAs)) errors.push(`${at} does not quote him (words and citedAs are required)`)
            if (!filledText(item?.choice)) errors.push(`${at} does not say what the choice is (choice)`)
            if (!item?.basisEvidence) errors.push(`${at} carries no basis evidence`)
            const named = [...tokensOf(item?.selector), ...tokensOf(item?.value)].filter(token => refusedList.includes(token))
            if (named.length) errors.push(`${at} names ${[...new Set(named)].join(', ')}, which a provisional realization may not use (his D7)`)
        }
        // Stage A review fix: a provisional realization holds his choices, never the role-yield marker (a ruled item restatement's alone).
        errors.push(...roleYieldMarkerRefusals(items, which))
        // Stage B (23 October 2026): no placeholder extent for an object, and no supersession or pairing.
        errors.push(...placeholderExtentRefusals(items, which, objectRows, relativeTerms))
        // Stage E (23 October 2026): a variant's composition, and what its authorized knowledge says suits its objects.
        errors.push(...variantRefusals(realization, realizations, which))
        errors.push(...suitabilityRefusals(realization?.objectSuitability, which, objectKinds))
    }
    return errors
}

/**
 * **The integrity gate of a variant** — stage E, 23 October 2026 (the design's Stage E: *"`basedOn` plus `withdraws` (each with a reason)
 * plus added items, composed once and passed through an integrity gate"*; its risk 8, *"Variant composition dropping or duplicating
 * items"*). A variant names a realization of the same file, which is itself no variant (composed once, never a chain), and realizes the same
 * context; every item it withdraws is an item of that realization, named once, with why; it withdraws or adds something (a variant equal to
 * its base would be a second name for one realization); and its composed items - the base's without the withdrawn ones, then its own - carry
 * each id once. Its own items are held to every rule above like any realization's; the base's were held to them under the base. A
 * realization that is no variant may withdraw nothing. Empty where nothing is refused.
 */
function variantRefusals(realization: any, realizations: any[], which: string): string[] {
    const errors: string[] = []
    const withdraws = realization?.withdraws
    if (realization?.basedOn === undefined) {
        if (withdraws !== undefined) errors.push(`${which} withdraws items and is based on no realization; only a variant (basedOn) withdraws`)
        return errors
    }
    const baseId = String(realization.basedOn ?? '')
    const base = realizations.find(candidate => candidate?.id === baseId)
    if (!filledText(realization.basedOn) || baseId === String(realization?.id ?? '') || !base) {
        errors.push(`${which} is based on ${JSON.stringify(realization.basedOn)}, which is no other realization of the file`)
        return errors
    }
    if (base.basedOn !== undefined) errors.push(`${which} is based on ${baseId}, which is itself a variant: a variant is composed once, from a realization that is none`)
    if (base.realizes !== realization.realizes) errors.push(`${which} realizes ${JSON.stringify(realization.realizes)} and its base ${baseId} realizes ${JSON.stringify(base.realizes)}`)
    const baseIds: string[] = (Array.isArray(base.items) ? base.items : []).map((item: any) => String(item?.id ?? ''))
    const list: any[] = Array.isArray(withdraws) ? withdraws : []
    if (withdraws !== undefined && !Array.isArray(withdraws)) errors.push(`${which} lists its withdrawals as something other than a list`)
    const withdrawn = new Set<string>()
    for (const [i, entry] of list.entries()) {
        const itemId = String(entry?.item ?? '')
        if (!filledText(entry?.item) || !filledText(entry?.because)) errors.push(`${which}: withdrawal ${i + 1} must name the item and say why (item, because)`)
        else if (!baseIds.includes(itemId)) errors.push(`${which} withdraws ${itemId}, which is no item of ${baseId}`)
        if (withdrawn.has(itemId)) errors.push(`${which} withdraws ${itemId} twice`)
        withdrawn.add(itemId)
    }
    const own: string[] = (Array.isArray(realization.items) ? realization.items : []).map((item: any) => String(item?.id ?? ''))
    if (!withdrawn.size && !own.length) errors.push(`${which} withdraws nothing from ${baseId} and adds nothing to it, so it is ${baseId} under a second name`)
    const composed = [...baseIds.filter(id => !withdrawn.has(id)), ...own]
    const seen = new Set<string>()
    for (const id of composed) {
        if (seen.has(id)) errors.push(`${which}: its composed items carry ${id} twice`)
        seen.add(id)
    }
    /**
     * A reference inside the composed items to an item of the base or of the variant is a reference to an item of the variant once composed
     * (`repointedTo`): it must name an item the composition keeps. A kept item that refers to a withdrawn one would leave the variant with a
     * reference to nothing, so it is refused, named, and so is a reference to an item neither holds.
     */
    const kept = (Array.isArray(base.items) ? base.items : []).filter((item: any) => !withdrawn.has(String(item?.id ?? '')))
    for (const item of [...kept, ...(Array.isArray(realization.items) ? realization.items : [])]) {
        for (const ref of structuralRefsIn(item)) {
            if (ref.contractId !== base.contractId && ref.contractId !== realization.contractId) continue
            if (withdrawn.has(ref.itemId)) errors.push(`${which}: the item ${String(item?.id)} refers to ${ref.itemId}, which it withdraws`)
            else if (!seen.has(ref.itemId)) errors.push(`${which}: the item ${String(item?.id)} refers to ${ref.itemId}, which its composed items do not hold`)
        }
    }
    return errors
}

/** Every typed structural reference inside a value (`{ structuralRef: { contractId, itemId } }`, at any depth). */
function structuralRefsIn(value: unknown): { contractId: string; itemId: string }[] {
    if (!value || typeof value !== 'object') return []
    if (Array.isArray(value)) return value.flatMap(structuralRefsIn)
    const ref = (value as { structuralRef?: { contractId?: unknown; itemId?: unknown } }).structuralRef
    const own = ref && typeof ref === 'object' && typeof ref.contractId === 'string' && typeof ref.itemId === 'string' ? [{ contractId: ref.contractId, itemId: ref.itemId }] : []
    return [...own, ...Object.entries(value as Record<string, unknown>).filter(([key]) => key !== 'structuralRef').flatMap(([, inner]) => structuralRefsIn(inner))]
}

/**
 * A copy of a value with every typed structural reference to the contract `from` re-pointed to the contract `to` (stage E): a variant's
 * composed items are ONE contract, so a kept item's reference to another item of its base reads as a reference to that item in the variant.
 * Nothing else is touched (prose that mentions an id stays as written).
 */
function repointedTo(value: unknown, from: string, to: string): unknown {
    if (!value || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map(inner => repointedTo(inner, from, to))
    const out: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
        if (key === 'structuralRef' && inner && typeof inner === 'object' && (inner as { contractId?: unknown }).contractId === from) out[key] = { ...(inner as Record<string, unknown>), contractId: to }
        else out[key] = repointedTo(inner, from, to)
    }
    return out
}

/**
 * **What a realization's authorized knowledge says suits its objects** — stage E, 23 October 2026. Christian, reply filed 25 October 2026,
 * item 3: *"[Object] dimensions and suitability should be determined through approved [sport] knowledge and available equipment."* (His
 * nouns bracketed for the coupling ratchet.) Each entry
 * speaks of one kind the register's sessionResources lists, once, as a width range in metres (at least one bound, each more than zero, the
 * lower not above the upper), in his cited words with who ruled it and when. His decision 4 of the note sent to him is still open: no
 * production realization carries an entry, and a realization carrying one without his words is refused whole.
 */
function suitabilityRefusals(entries: unknown, which: string, objectKinds: string[]): string[] {
    if (entries === undefined) return []
    if (!Array.isArray(entries)) return [`${which} states its object suitability as something other than a list`]
    const errors: string[] = []
    const kinds = new Set<string>()
    const bound = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value) && value > 0)
    for (const [i, entry] of entries.entries()) {
        const at = `${which}: object suitability ${i + 1}`
        const kind = String(entry?.kind ?? '')
        if (!objectKinds.includes(kind)) errors.push(`${at} speaks of ${JSON.stringify(entry?.kind)}, which is no kind a session states its availability of (${objectKinds.join(', ') || 'none'})`)
        if (kinds.has(kind)) errors.push(`${at} speaks of ${kind} a second time`)
        kinds.add(kind)
        const min = entry?.widthM?.min
        const max = entry?.widthM?.max
        if (!bound(min) || !bound(max) || (min === null && max === null) || (typeof min === 'number' && typeof max === 'number' && min > max)) {
            errors.push(`${at} must state a width range in metres (widthM.min and widthM.max, each null or more than zero, at least one stated, the lower not above the upper)`)
        }
        if (!filledText(entry?.ruledOn) || !filledText(entry?.by) || !filledText(entry?.citedAs) || !Array.isArray(entry?.words) || !entry.words.length || !entry.words.every(filledText)) {
            errors.push(`${at} does not quote him (ruledOn, by, citedAs and his words are all required)`)
        }
    }
    return errors
}

/**
 * Every provisional realization, validated and as deep copies. `file` is a parameter ONLY so a test can load a copy
 * carrying a TEST-ONLY item through the same gate; production passes none.
 */
export function loadProvisionalRealizations(file: any = readJson(PROVISIONAL_REALIZATIONS_FILE)): ProvisionalRealization[] {
    const errors = validateProvisionalRealizations(file)
    if (errors.length) throw new Error(`${PROVISIONAL_REALIZATIONS_FILE} failed its integrity gate: ${errors.join(' | ')}`)
    const copy = JSON.parse(JSON.stringify(file))
    /**
     * A variant's items composed once (stage E): its base's, in their order, without the ones it withdraws, then its own, every typed reference
     * to an item of the base re-pointed to the variant (`repointedTo`: one contract). The gate above has already refused a variant whose base
     * is missing or itself a variant, a withdrawal naming no item of the base, a composition carrying an id twice and a reference to an item
     * the composition does not keep, so this reads the file and decides nothing. A realization that is no variant holds exactly its own items.
     */
    const rawById = new Map((copy.realizations as any[]).map(realization => [String(realization.id), realization]))
    const composedItems = (realization: any): any[] => {
        if (realization.basedOn === undefined) return realization.items as any[]
        const withdrawn = new Set(((realization.withdraws ?? []) as any[]).map(entry => String(entry.item)))
        const base = rawById.get(String(realization.basedOn))
        const items = [...(base.items as any[]).filter(item => !withdrawn.has(String(item.id))), ...(realization.items as any[])]
        return items.map(item => repointedTo(item, String(base.contractId), String(realization.contractId)))
    }
    return (copy.realizations as any[]).map(realization => ({
        contractId: String(realization.contractId),
        objectId: String(realization.contractId),
        knowledgeVersion: 'stage-b',
        items: composedItems(realization).map(item => {
            const { id, ...rest } = item
            return { itemId: String(id), ...rest } as ContractItem
        }),
        ...(realization.basedOn !== undefined
            ? { basedOn: String(realization.basedOn), withdrawn: ((realization.withdraws ?? []) as any[]).map(entry => ({ itemId: String(entry.item), because: String(entry.because) })) }
            : {}),
        ...(Array.isArray(realization.objectSuitability) ? { objectSuitability: JSON.parse(JSON.stringify(realization.objectSuitability)) as ObjectSuitability[] } : {}),
        declarations: [],
        relationshipRules: [],
        provisionalId: String(realization.id),
        category: PROVISIONAL_REALIZATION_CHOICE,
        realizes: String(realization.realizes),
        ruledOn: String(realization.ruledOn),
        by: String(realization.by),
        citedAs: String(realization.citedAs),
        words: (realization.words as unknown[]).map(String),
        realizationChoices: realization.realizationChoices ? String(realization.realizationChoices) : null,
        notWithPracticeSituations: (realization.notWithPracticeSituations as any[]).map(s => ({ id: String(s.id), basis: String(s.basis), because: String(s.because) })),
        testingBoundaries: realization.testingBoundaries
            ? {
                  players: (realization.testingBoundaries.players as number[]).map(Number),
                  ...(Array.isArray(realization.testingBoundaries.areas) ? { areas: (realization.testingBoundaries.areas as any[]).map(area => ({ lengthM: Number(area.lengthM), widthM: Number(area.widthM) })) } : {}),
                  words: String(realization.testingBoundaries.words),
                  citedAs: String(realization.testingBoundaries.citedAs),
                  note: realization.testingBoundaries.note ? String(realization.testingBoundaries.note) : null,
              }
            : null,
    }))
}

/** The provisional realization a record names, as a copy, or null where it names none. A name that resolves to nothing throws. */
export function provisionalRealizationNamed(id: string | null | undefined, realizations: ProvisionalRealization[] = loadProvisionalRealizations()): ProvisionalRealization | null {
    if (!id) return null
    const found = realizations.find(realization => realization.provisionalId === id)
    if (!found) throw new Error(`a record names the provisional realization ${id}, which ${PROVISIONAL_REALIZATIONS_FILE} does not hold`)
    return JSON.parse(JSON.stringify(found)) as ProvisionalRealization
}

export function corpusInput(): DerivationInput {
    const contracts = loadCorpusContracts()
    return {
        selection: contracts.map(c => ({ objectId: c.objectId, knowledgeVersion: 'stage-b' })),
        contracts,
        envelope: CORPUS_ENVELOPE,
        register: loadRegister(),
        derivationRules: { version: 'rev-5' },
    }
}

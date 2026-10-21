/**
 * **The three wording statuses as data, and verbatim extracts of approved wording** — stage 3B, 21 October 2026.
 *
 * His reply filed 22 October 2026, item 4: *"Yes. I approve generating abbreviated versions of approved statements for the Coach
 * Overview, provided their meaning remains accurate. The full approved wording should be preserved in Coach Details."* And: *"Please
 * distinguish between: Approved canonical wording. An abbreviated presentation derived from approved wording. Newly proposed language
 * awaiting approval."* And: *"Shortening must not introduce new meanings, omit a condition that changes the essential understanding, or
 * silently turn a qualified rule into an unrestricted one. This should be handled as a general communication capability, not as a special
 * case for Play Out from the Back."*
 *
 * So every coach-facing statement carries one of three statuses, as data, with where its words come from:
 *
 *   - `APPROVED`: an entry or template sentence of `approved-coach-wording.json`, said whole and word for word, or his authored knowledge
 *     text (a Learning Goal's coach definition). Coach Details say approved wording only this way (`detailsWordingOf`), never shortened.
 *   - `DERIVED_FROM_APPROVED`: a verbatim EXTRACT of an approved entry the game says — whole sentences of it, or the leading clause of one
 *     of its sentences up to its first ";", in the entry's own order and words (`extractsFor`). Nothing is reworded: a condensation in new
 *     words is not built here, and any would be newly proposed language. Each extract names its source entry and the entry's covers it
 *     keeps and leaves, the two lists exactly partitioning them, and is checked by `extractUnusableBecause` before it is listed.
 *   - `DRAFT`: everything else — every in-code sentence, and any part of one (`extractStatusOf`: only an APPROVED source gives a
 *     derived extract; a part of a DRAFT sentence stays DRAFT).
 *
 * **What an extract keeps is not computed here.** Which of an entry's covers one of its sentences states is a reading of his words: no
 * field of the approved table records it, and no mechanism can compute it from the words (BUILD PLAN stage 3B assumed one could). So an
 * extract keeps exactly the covers a recorded reading gives it (`CoverReading`), and none where no reading is recorded — the production
 * case today: it then keeps nothing and leaves every cover to its source entry, which Coach Details say whole for the same game. That
 * never claims more than the extract's words are known to say; the overview's agreement check (stage 3D) reads `keeps`, so no extract
 * can stand for a condition until a reading is recorded. The slots of an entry are different: a slot inside the extract's own words IS
 * said there, so its field is cited and its number bound, mechanically.
 *
 * **An approved entry that stops matching the game demotes its extracts to withheld.** An extract is listed as derived only where its
 * source entry is said for the game, exactly as the renderer says it (`approvedSentences`); an entry that speaks about elements the game
 * holds but no longer holds on its values has its extracts withheld, with why, and they are never shown as derived. The table itself is
 * read, never written: `approved-coach-wording.json` stays approved-only and unchanged.
 *
 * Everything is read from the entries and the game; no goal, entry id, condition type, sport term or value is written here.
 */
import { ApprovedTemplateSentence, approvedTemplateSentences, ApprovedWording, approvedWording, canonicalJson, ElementLocator, fillTemplate } from './approved-wording'
import { approvedSentences, Binding, Instruction, wordedFieldRows } from './render-concrete-game'

/** The three statuses his item 4 distinguishes (the RC3 draft's names: approved canonical, abbreviated derived, newly proposed). */
export type WordingStatus = 'APPROVED' | 'DERIVED_FROM_APPROVED' | 'DRAFT'

/** Where approved words come from: an entry or a template sentence of the approved table, or authored knowledge text. */
export type WordingSource =
    | { kind: 'APPROVED_ENTRY'; id: string }
    | { kind: 'APPROVED_TEMPLATE'; id: string }
    | { kind: 'KNOWLEDGE'; file: string; table: string; id: string; column: string }

/** A Coach Details sentence's wording: approved wording said whole (with the entry or template it is), or DRAFT. Never derived. */
export interface DetailsWording {
    wording: Extract<WordingStatus, 'APPROVED' | 'DRAFT'>
    source: WordingSource | null
}

/** An approved entry as the renderer says it for one game: its id, its words and what it cites there. */
export interface SaidEntry {
    id: string
    text: string
    from: string[]
}

/**
 * **The approved entries said for a game, each with its id** — the renderer's own `approvedSentences`, asked entry by entry (each entry is
 * matched independently of the others, so together they are exactly what it says with the whole table).
 */
export function approvedEntriesSaid(game: any, wording: ApprovedWording[] = approvedWording()): SaidEntry[] {
    return wording.flatMap(entry => approvedSentences(game, [entry]).map(said => ({ id: entry.id, text: said.text, from: [...said.from] })))
}

/**
 * **A Details sentence's status and source** — stage 3B. APPROVED exactly where the rule before it said so (stage M4: its text is a
 * sentence an approved entry says for the game, or one of his template sentences word for word, which an instruction says without its
 * final full stop), now with WHICH entry or template it is; DRAFT with no source otherwise. The status is decided by text, as before;
 * the source is the first entry, in table order, that says that text, then the first template.
 */
export function detailsWordingOf(text: string, said: SaidEntry[], templates: ApprovedTemplateSentence[] = approvedTemplateSentences()): DetailsWording {
    const entry = said.find(candidate => candidate.text === text)
    if (entry) return { wording: 'APPROVED', source: { kind: 'APPROVED_ENTRY', id: entry.id } }
    const template = templates.find(candidate => candidate.sentence.replace(/\.$/, '') === text)
    if (template) return { wording: 'APPROVED', source: { kind: 'APPROVED_TEMPLATE', id: template.id } }
    return { wording: 'DRAFT', source: null }
}

/**
 * **The status of a part of a statement, from the statement's own** (his item 4, *"An abbreviated presentation derived from approved
 * wording"*): a part of approved wording said whole is derived from it; a part of anything else — a DRAFT sentence, or a part of a part —
 * is DRAFT. Only an extract made from the approved entry itself is derived (`extractsFor`).
 */
export const extractStatusOf = (source: WordingStatus): Extract<WordingStatus, 'DERIVED_FROM_APPROVED' | 'DRAFT'> => (source === 'APPROVED' ? 'DERIVED_FROM_APPROVED' : 'DRAFT')

/** One sentence of a statement: its words with its own end mark, the end mark, and its leading clause (the words before its first ";"). */
export interface SourceSentence {
    text: string
    mark: string
    clause: string | null
}

const END_MARKS = '.!?'
const isCapital = (ch: string | undefined): boolean => !!ch && ch.toUpperCase() === ch && ch.toLowerCase() !== ch

/**
 * **A statement's sentences**: a sentence ends at ".", "!" or "?" followed by one space and a capital letter (so "2.5" or a lower-case
 * continuation never ends one), or at the end of the text. Its leading clause is the words before its first ";", where words follow it.
 */
export function sentencesOf(text: string): SourceSentence[] {
    const sentences: SourceSentence[] = []
    let start = 0
    for (let at = 0; at < text.length; at++) {
        const last = at === text.length - 1
        if (!last && !(END_MARKS.includes(text[at]) && text[at + 1] === ' ' && isCapital(text[at + 2]))) continue
        const words = text.slice(start, at + 1)
        const mark = END_MARKS.includes(words[words.length - 1]) ? words[words.length - 1] : ''
        const cut = words.indexOf(';')
        const clause = cut > 0 && words.slice(cut + 1).trim().length > 0 ? words.slice(0, cut).trimEnd() : null
        sentences.push({ text: words, mark, clause })
        start = at + 2
    }
    return sentences
}

/** One part of an extract: a whole sentence of its source, or the leading clause of one, by the sentence's place (from 0). */
export interface ExtractUnit {
    sentence: number
    part: 'WHOLE_SENTENCE' | 'LEADING_CLAUSE'
}

/** The words of these parts, in order, each a whole sentence or a leading clause closed by its sentence's own end mark; null if any is not one. */
export function textOfUnits(sentences: SourceSentence[], units: ExtractUnit[]): string | null {
    const words: string[] = []
    for (const unit of units) {
        const sentence = sentences[unit.sentence]
        if (!sentence) return null
        if (unit.part === 'WHOLE_SENTENCE') words.push(sentence.text)
        else if (unit.part === 'LEADING_CLAUSE' && sentence.clause !== null) words.push(`${sentence.clause}${sentence.mark}`)
        else return null
    }
    return words.join(' ')
}

/** Why these parts are not an extract of these sentences (in order, each sentence at most once, a part of it, never all of it), or null. */
export function unitsUnusableBecause(sentences: SourceSentence[], units: unknown): string | null {
    if (!Array.isArray(units) || !units.length) return 'it names no part of its source'
    let previous = -1
    for (const unit of units as ExtractUnit[]) {
        if (!unit || !Number.isInteger(unit.sentence) || unit.sentence < 0 || unit.sentence >= sentences.length) return 'it names a sentence its source does not have'
        if (unit.sentence <= previous) return "its parts are not in the source's order, each sentence at most once"
        if (unit.part !== 'WHOLE_SENTENCE' && unit.part !== 'LEADING_CLAUSE') return 'a part is neither a whole sentence nor a leading clause'
        if (unit.part === 'LEADING_CLAUSE' && sentences[unit.sentence].clause === null) return `sentence ${unit.sentence + 1} of its source has no leading clause ending at ";"`
        previous = unit.sentence
    }
    if (units.length === sentences.length && (units as ExtractUnit[]).every(unit => unit.part === 'WHOLE_SENTENCE')) return 'it is the whole source, which is approved wording said whole, not an extract'
    return null
}

/**
 * The most sentences a statement may have for its extracts to be listed: each sentence triples the choices, so a longer statement's are
 * not enumerated (`extractsFor` says so, never silently). Every approved entry today has three or fewer.
 */
export const MOST_SENTENCES_EXTRACTED = 6

/** Parts in reading order: by sentence, a whole sentence before its leading clause. */
const byPlace = (a: ExtractUnit, b: ExtractUnit): number => a.sentence - b.sentence || (a.part === b.part ? 0 : a.part === 'WHOLE_SENTENCE' ? -1 : 1)

/**
 * **Every extract a statement admits**: each in-order choice, per sentence, of nothing, the whole sentence or (where it has one) its
 * leading clause — except choosing nothing at all, and choosing every sentence whole (the statement itself). Ordered by how many parts,
 * then by place. None for a statement longer than `MOST_SENTENCES_EXTRACTED`.
 */
export function unitSelectionsOf(sentences: SourceSentence[]): ExtractUnit[][] {
    if (sentences.length > MOST_SENTENCES_EXTRACTED) return []
    let selections: ExtractUnit[][] = [[]]
    sentences.forEach((sentence, at) => {
        const options: (ExtractUnit | null)[] = [null, { sentence: at, part: 'WHOLE_SENTENCE' }, ...(sentence.clause !== null ? [{ sentence: at, part: 'LEADING_CLAUSE' as const }] : [])]
        selections = selections.flatMap(selection => options.map(option => (option ? [...selection, option] : selection)))
    })
    const compare = (a: ExtractUnit[], b: ExtractUnit[]): number => {
        if (a.length !== b.length) return a.length - b.length
        for (let n = 0; n < a.length; n++) if (byPlace(a[n], b[n]) !== 0) return byPlace(a[n], b[n])
        return 0
    }
    return selections.filter(units => unitsUnusableBecause(sentences, units) === null).sort(compare)
}

/** An extract's name: its source entry and its parts ("s" a whole sentence, "c" a leading clause, numbered from 1). */
const extractId = (entryId: string, units: ExtractUnit[], element: string | null): string =>
    `${entryId}:${units.map(unit => `${unit.part === 'WHOLE_SENTENCE' ? 's' : 'c'}${unit.sentence + 1}`).join('+')}${element ? `@${element}` : ''}`

/** One cover of the source entry, by its place in the entry: its row, the element it names, and the field it holds on in this game. */
export interface CoverRef {
    index: number
    row: string
    element: ElementLocator | null
    path: string | null
}

/**
 * **A reading of what a part of an approved entry states**: the indexes of the entry's covers these parts state, or null where no reading
 * is recorded. None is recorded today (module comment); a test may hand one.
 */
export type CoverReading = (entry: ApprovedWording, units: ExtractUnit[]) => number[] | null
export const NO_RECORDED_READING: CoverReading = () => null

/** A verbatim extract of an approved entry said for this game: DERIVED_FROM_APPROVED, with its source and its cover accounting. */
export interface DerivedExtract {
    id: string
    text: string
    wording: 'DERIVED_FROM_APPROVED'
    source: { kind: 'APPROVED_ENTRY'; id: string }
    units: ExtractUnit[]
    /** The source's covers these words state (by a recorded reading), and those they leave to the source entry said whole in Details. */
    keeps: CoverRef[]
    leaves: CoverRef[]
    /** Whether `keeps` comes from a recorded reading; `NONE_RECORDED`: none is, so it keeps nothing. */
    reading: 'NONE_RECORDED' | 'RECORDED'
    /** What it cites in this game: the kept covers' fields, then the fields of the slots inside its words. */
    from: string[]
    /** Each number it says (a numeric slot inside its words), bound to its field, in the order said. */
    bindings: Binding[]
}

/** An extract that may not be shown as derived here, and why (its source entry not said for this game, or it fails its check). */
export interface WithheldExtract {
    id: string
    text: string | null
    source: { kind: 'APPROVED_ENTRY'; id: string }
    units: ExtractUnit[]
    why: string
}

const fieldOf = (node: any, dotted: string): unknown => dotted.split('.').reduce<any>((at, key) => (at == null ? undefined : at[key]), node)

/** The values the slots were filled with, read back from the said text against the entry's sentence; null where they cannot be. */
function slotValuesOf(template: string, said: string): Record<string, string> | null {
    const pieces = template.split(/\{(\w+)\}/)
    const values: Record<string, string> = {}
    let at = 0
    if (!said.startsWith(pieces[0])) return null
    at = pieces[0].length
    for (let n = 1; n < pieces.length; n += 2) {
        const name = pieces[n]
        const literal = pieces[n + 1]
        const lastPiece = n + 2 >= pieces.length
        let end: number
        if (literal === '') {
            if (!lastPiece) return null
            end = said.length
        } else {
            end = lastPiece ? said.length - literal.length : said.indexOf(literal, at)
            if (end < at || (lastPiece && !said.endsWith(literal))) return null
        }
        const value = said.slice(at, end)
        if (name in values && values[name] !== value) return null
        values[name] = value
        at = end + literal.length
    }
    return at === said.length && fillTemplate([template], values) === said ? values : null
}

/** The slot names a piece of an entry's sentence carries, in order. */
const slotsIn = (words: string): string[] => [...words.matchAll(/\{(\w+)\}/g)].map(match => match[1])

/**
 * **Where each cover of an entry holds in this game**: the field path of the element it names (a locator picking out exactly one
 * element of its collection) or, for an entry matched element by element, of the element it was said for (`prefix`), on the cover's row.
 * Read from the game's own fields only approved words may say (`wordedFieldRows`), so the paths are the renderer's.
 */
function coverPaths(game: any, entry: ApprovedWording, prefix: string | null): (string | null)[] {
    const worded = wordedFieldRows(game)
    return entry.covers.map(cover => {
        let element = prefix
        if (cover.element) {
            const members = fieldOf(game, cover.element.base)
            const picked = Array.isArray(members) ? members.filter(member => canonicalJson(fieldOf(member, cover.element!.field)) === canonicalJson(cover.element!.equals)) : []
            element = picked.length === 1 ? `${cover.element.base}[${picked[0]?.elementId}]` : null
        }
        return element ? (worded.find(field => field.row === cover.row && field.path.startsWith(`${element}.`))?.path ?? null) : null
    })
}

/** Whether an entry speaks about elements this game holds: some cover's field is held on the element it names (or on any element). */
const inPlay = (game: any, entry: ApprovedWording): boolean =>
    entry.covers.every(cover => cover.element) ? coverPaths(game, entry, null).some(path => path !== null) : wordedFieldRows(game).some(field => entry.covers.some(cover => cover.row === field.row))

const refsOf = (entry: ApprovedWording, indexes: number[], paths: (string | null)[]): CoverRef[] =>
    indexes.map(index => ({ index, row: entry.covers[index].row, element: entry.covers[index].element ? { ...entry.covers[index].element! } : null, path: paths[index] ?? null }))

/** Why an extract's cover accounting does not exactly partition its source entry's covers, or null. */
function partitionUnusableBecause(entry: ApprovedWording, keeps: unknown, leaves: unknown): string | null {
    if (!Array.isArray(keeps) || !Array.isArray(leaves)) return 'it does not account for its source\'s covers (keeps and leaves)'
    const seen = new Set<number>()
    for (const ref of [...keeps, ...leaves] as CoverRef[]) {
        if (!ref || !Number.isInteger(ref.index) || ref.index < 0 || ref.index >= entry.covers.length) return 'it accounts for a cover its source does not have'
        if (seen.has(ref.index)) return `cover ${ref.index + 1} of its source is accounted for twice`
        seen.add(ref.index)
        const cover = entry.covers[ref.index]
        if (ref.row !== cover.row || canonicalJson(ref.element ?? null) !== canonicalJson(cover.element ?? null)) return `cover ${ref.index + 1} is named with another row or element than its source gives it`
    }
    if (seen.size !== entry.covers.length) return `its keeps and leaves account for ${seen.size} of its source's ${entry.covers.length} covers, so they do not partition them`
    return null
}

/**
 * **Why an extract may not be shown as derived from approved wording**, or null: its source is an approved entry; it carries no approval
 * of its own; its parts are an extract of the source (in order, never the whole); its words are exactly those parts' words (no word
 * changed, added or dropped); its keeps and leaves exactly partition the source's covers; it keeps nothing unless a reading is recorded
 * (and, given the reading, exactly what it gives). Given a game, also: the source entry is said for it, the words are its parts there
 * (slots filled as said), and it cites exactly its kept covers' fields and the fields of the slots inside its words.
 */
export function extractUnusableBecause(extract: any, options: { wording?: ApprovedWording[]; game?: any; reading?: CoverReading } = {}): string | null {
    const wording = options.wording ?? approvedWording()
    if (!extract || typeof extract !== 'object') return 'not an object'
    if ('approvedBy' in extract) return 'an extract carries no approval of its own: only his entries do'
    if (extract.wording !== 'DERIVED_FROM_APPROVED') return `its status is "${extract.wording}", and an extract of approved wording is DERIVED_FROM_APPROVED`
    if (extract.source?.kind !== 'APPROVED_ENTRY') return 'its source is not an approved entry'
    const entry = wording.find(candidate => candidate.id === extract.source.id)
    if (!entry) return `its source "${extract.source.id}" is not an approved entry`
    const template = sentencesOf(entry.sentence)
    const units = unitsUnusableBecause(template, extract.units)
    if (units) return units
    const partition = partitionUnusableBecause(entry, extract.keeps, extract.leaves)
    if (partition) return partition
    if (extract.reading !== 'NONE_RECORDED' && extract.reading !== 'RECORDED') return 'it does not say whether what it keeps comes from a recorded reading'
    if (extract.reading === 'NONE_RECORDED' && extract.keeps.length) return 'it keeps covers with no reading recorded: what a part of an entry states is a reading of his words, never assumed'
    if (options.reading) {
        const recorded = options.reading(entry, extract.units)
        const kept = (extract.keeps as CoverRef[]).map(ref => ref.index).sort((a, b) => a - b)
        if ((recorded === null) !== (extract.reading === 'NONE_RECORDED') || canonicalJson([...(recorded ?? [])].sort((a, b) => a - b)) !== canonicalJson(kept)) return 'what it keeps is not what the recorded reading gives it'
    }
    const hasSlots = slotsIn(entry.sentence).length > 0
    if (options.game === undefined) {
        if (hasSlots) return 'an extract of an entry with slots is checked only against the game that fills them'
        if (extract.text !== textOfUnits(template, extract.units)) return `its words are not its source's: "${extract.text}" is not "${textOfUnits(template, extract.units)}"`
        return null
    }
    const instances = instancesOf(options.game, entry)
    if (!instances.length) return `its source entry ${entry.id} is not said for this game`
    for (const instance of instances) {
        const built = buildExtract(options.game, entry, instance, extract.units, extract.keeps.map((ref: CoverRef) => ref.index), extract.reading === 'RECORDED' ? 'RECORDED' : 'NONE_RECORDED')
        if (typeof built === 'string') continue
        if (built.text !== extract.text) continue
        if (canonicalJson(built.from) !== canonicalJson(extract.from)) return `it cites ${JSON.stringify(extract.from)}, and its kept covers and slots are ${JSON.stringify(built.from)} in this game`
        if (canonicalJson(built.bindings) !== canonicalJson(extract.bindings ?? [])) return 'its numbers are not bound to the fields of the slots inside its words'
        return null
    }
    return `its words are not those parts of its source as this game says it: "${extract.text}"`
}

/** One saying of an entry for a game: the renderer's instruction, and the element it was said for (null for a located entry). */
interface Instance {
    said: Instruction
    prefix: string | null
}

function instancesOf(game: any, entry: ApprovedWording): Instance[] {
    const located = entry.covers.length > 0 && entry.covers.every(cover => cover.element)
    return approvedSentences(game, [entry]).map(said => {
        const first = said.from[0] ?? ''
        return { said, prefix: located ? null : first.slice(0, first.lastIndexOf('].') + 1) || null }
    })
}

/** An extract of one saying of an entry, or why it cannot be built. */
function buildExtract(game: any, entry: ApprovedWording, instance: Instance, units: ExtractUnit[], kept: number[], reading: DerivedExtract['reading']): DerivedExtract | string {
    const template = sentencesOf(entry.sentence)
    const names = slotsIn(entry.sentence)
    const values = names.length ? slotValuesOf(entry.sentence, instance.said.text) : {}
    if (!values) return 'the words this game fills its slots with cannot be read back from what it says'
    const filled: SourceSentence[] = template.map(sentence => ({
        text: fillTemplate([sentence.text], values) ?? sentence.text,
        mark: sentence.mark,
        clause: sentence.clause === null ? null : (fillTemplate([sentence.clause], values) ?? sentence.clause),
    }))
    if (filled.map(sentence => sentence.text).join(' ') !== instance.said.text) return 'its sentences, filled as this game fills them, are not what it says'
    const text = textOfUnits(filled, units)
    if (text === null) return 'its parts are not parts of its source'
    const paths = coverPaths(game, entry, instance.prefix)
    if (paths.some(path => path === null || !instance.said.from.includes(path))) return 'a cover of its source holds on no field this game says it for'
    if (kept.some(index => !Number.isInteger(index) || index < 0 || index >= entry.covers.length) || new Set(kept).size !== kept.length) return 'its reading names a cover its source does not have, or one twice'
    const keptSorted = [...kept].sort((a, b) => a - b)
    const left = entry.covers.map((_, index) => index).filter(index => !kept.includes(index))
    // The slots inside its words: each is said there, so its field is cited and, where it is a number, bound.
    const keptSlots = units.flatMap(unit => slotsIn(unit.part === 'WHOLE_SENTENCE' ? template[unit.sentence].text : (template[unit.sentence].clause ?? '')))
    if (keptSlots.length && (instance.prefix === null || keptSlots.some(name => typeof entry.slots?.[name]?.field !== 'string'))) return 'a slot inside its words names no field of the element it was said for'
    const slotPath = (name: string) => `${instance.prefix}.${entry.slots![name].field}`
    const numeric = new Map((instance.said.parts ?? []).flatMap(part => part.bindings).map(binding => [binding.path, binding] as const))
    return {
        id: extractId(entry.id, units, instance.prefix),
        text,
        wording: 'DERIVED_FROM_APPROVED',
        source: { kind: 'APPROVED_ENTRY', id: entry.id },
        units: units.map(unit => ({ ...unit })),
        keeps: refsOf(entry, keptSorted, paths),
        leaves: refsOf(entry, left, paths),
        reading,
        from: [...new Set([...keptSorted.map(index => paths[index]!), ...keptSlots.map(slotPath)])],
        bindings: keptSlots.map(slotPath).filter(path => numeric.has(path)).map(path => ({ ...numeric.get(path)! })),
    }
}

/**
 * **Every verbatim extract of the approved wording a game says** — stage 3B. For each approved entry that speaks about elements the game
 * holds: where the game says it (`approvedSentences`), each extract its sentence admits (`unitSelectionsOf`), DERIVED_FROM_APPROVED,
 * keeping the covers a recorded reading gives it (none today) and leaving the rest, each checked by `extractUnusableBecause` against the
 * game before it is listed; where the game does not say it, every extract withheld, with why. An entry about nothing the game holds has
 * no extracts here. An entry with one sentence and no leading clause admits none.
 */
export function extractsFor(game: any, options: { wording?: ApprovedWording[]; reading?: CoverReading } = {}): { extracts: DerivedExtract[]; withheld: WithheldExtract[] } {
    const wording = options.wording ?? approvedWording()
    const reading = options.reading ?? NO_RECORDED_READING
    const extracts: DerivedExtract[] = []
    const withheld: WithheldExtract[] = []
    for (const entry of wording) {
        const template = sentencesOf(entry.sentence)
        if (!inPlay(game, entry)) continue
        const source = { kind: 'APPROVED_ENTRY' as const, id: entry.id }
        if (template.length > MOST_SENTENCES_EXTRACTED) {
            withheld.push({ id: `${entry.id}:`, text: null, source, units: [], why: `its source entry has ${template.length} sentences, more than the ${MOST_SENTENCES_EXTRACTED} whose extracts are listed` })
            continue
        }
        const selections = unitSelectionsOf(template)
        if (!selections.length) continue
        const instances = instancesOf(game, entry)
        if (!instances.length) {
            for (const units of selections) {
                withheld.push({
                    id: extractId(entry.id, units, null),
                    text: textOfUnits(template, units),
                    source,
                    units,
                    why: `its source entry ${entry.id} is not said for this game: it speaks about elements the game holds, and a cover does not hold on the game's value, so its extract is withheld and never shown as derived from approved wording`,
                })
            }
            continue
        }
        for (const instance of instances) {
            for (const units of selections) {
                const recorded = reading(entry, units)
                const built = buildExtract(game, entry, instance, units, recorded ?? [], recorded === null ? 'NONE_RECORDED' : 'RECORDED')
                if (typeof built === 'string') {
                    withheld.push({ id: extractId(entry.id, units, instance.prefix), text: null, source, units, why: built })
                    continue
                }
                const why = extractUnusableBecause(built, { wording, game, reading })
                if (why) withheld.push({ id: built.id, text: built.text, source, units, why })
                else extracts.push(built)
            }
        }
    }
    return { extracts, withheld }
}

/** A part of a statement that is not approved wording said whole (`extractStatusOf`): DRAFT, with its parts. */
export interface DraftExtract {
    text: string
    wording: 'DRAFT'
    units: ExtractUnit[]
}

/**
 * **The extracts a statement in newly proposed language admits — each DRAFT** (his item 4; BUILD PLAN DO NOT DO: *"Do not derive from a
 * DRAFT source and call the result derived."*). The same parts as an approved entry's, so a shortening of a DRAFT sentence can be shown
 * beside its source; its status is its source's (`extractStatusOf`), never derived.
 */
export function draftExtractsOf(text: string, source: Exclude<WordingStatus, 'APPROVED'> = 'DRAFT'): DraftExtract[] {
    const sentences = sentencesOf(text)
    return unitSelectionsOf(sentences).map(units => ({ text: textOfUnits(sentences, units)!, wording: extractStatusOf(source) as 'DRAFT', units }))
}

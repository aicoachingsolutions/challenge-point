/**
 * **TEST-ONLY review wording for a structure the configuration already holds and the checked renderer cannot say for teams without role
 * nouns** — 7 November 2026. Christian's reply received 7 November 2026, section 2, decision 1, "Approved for isolated implementation and
 * testing.": "Please add the minimum reusable wording support necessary for reciprocal teams, target zones, and other structures already
 * represented in the configuration data." "The coach-facing text and diagram should derive from the structured configuration rather than
 * require separately authored instructions for each activity." And, in the same section: "This does not authorize unapproved
 * scoring-condition language or the promotion of illustrative configuration values into canonical knowledge."
 *
 * **Never served.** Only unit tests import this module (a static scan in `review-structure-wording.unit.ts` pins it), and its supplement
 * reaches a build only through the one TEST-ONLY option of `buildActivityUnderAuthorizationRecords` that injects it, which no route
 * calls. The live renderer, fidelity and every route are unchanged; nothing here is read by a coach's or an administrator's build. Every
 * sentence it adds carries the review-only marker `reviewOnly: 'DRAFT_NOT_SERVED'`, and its words are DRAFT: the review draft marks them so
 * (`reviewDraftOf`), because no approved entry says them.
 *
 * **What it says.** One structure: two target zones at opposite ends of the area, one depth, across the full width, each attacked by the
 * team whose attacking end it touches, where neither team is named by a role (reciprocal teams) and the renderer left both unmarked. The
 * renderer places a target zone at an end only by a role noun (`targetZone`; the merged sentence only with a physical layout, which only
 * role-block games carry), so for such teams it says the attacking direction ('Each team attacks the {noun} at the other team's end')
 * and leaves the marking unsaid, and fidelity refuses the regions unmarked (Q3, Q5). The words here are the renderer's own DRAFT words for
 * the zones set out once ('Mark a {d} m end {noun} across the full width at each end', the layout sentence of `render-concrete-game.ts`):
 * no new phrase. The noun is the regions' own, read from the game; the depth is the required depth the game holds, bound to the first
 * zone's along path. Nothing else: unequal depths, a zone short of an end or of the full width, both zones at one end, and teams named by
 * a role are left unsaid, so fidelity still refuses them as it does today.
 *
 * **Why the guard is load-bearing.** Fidelity holds the number to its path but does not read the placement words: measured 7 November
 * 2026, an unguarded copy of this sentence passes fidelity with the near zone moved inward or narrowed to half the width. So, as the
 * renderer's own E5a guards do, the sentence is said only where every condition below holds on the realized geometry.
 *
 * **No scoring condition is said.** The sentence cites only the zones' nouns and positions and the objectives' references, and the
 * supplement stays silent if a cited path is one only approved words may say (`wordedFieldRows`).
 *
 * Sport-neutral: rows, terms and nouns are the fixture's and the register's; no knowledge object, team role or sport term is named here.
 */
import { attackingEndIn } from '../realization/team-ends'
import { ATTACKING_END, gameReadingOf, Instruction, InstructionPart, RenderedActivity, rendererRegister, sectionFactsOf, statusesOf, strongest, wordedFieldRows } from './render-concrete-game'
import { assignSection, inSectionOrder } from './sections'

/** The marker every sentence this module adds carries: DRAFT, for review, never served. */
export const REVIEW_ONLY = 'DRAFT_NOT_SERVED' as const

/** A sentence this module adds: an instruction like the renderer's, marked review-only. */
export type ReviewOnlyInstruction = Instruction & { reviewOnly: typeof REVIEW_ONLY }

/** What the supplement reads of one game: the sentence it says, or why it says nothing (one entry per condition that fails). */
export interface EndZonesReading {
    said: ReviewOnlyInstruction | null
    silentBecause: string[]
}

interface EndZone {
    regionId: string
    noun: string
    objectiveId: string
    team: string
    alongPath: string
    acrossPath: string
    depth: number
    end: number
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/**
 * **Two reciprocal end zones, read from the realized game** (DRAFT words, review only). Said only where all of this holds:
 *   - exactly two objective target regions are left unmarked by the renderer (no Set up sentence other than a preference cites its noun,
 *     the test fidelity Q5 reads), each with a noun;
 *   - neither objective's team is named by a role in this game (`teamNoun` null), and the two teams differ;
 *   - each region's along position is the register's term "attacking end (of team T)", with one required depth (min equal to max, above zero) that its
 *     realized span has, touching the end line its objective's team attacks (`attackingEndIn`, the end the renderer's E5a guard reads);
 *   - each region's across interval is the whole width of the area;
 *   - the two ends differ, the two depths are equal and the two nouns are equal;
 *   - no cited path is a field only approved words may say.
 */
export function reciprocalEndZonesReading(fixture: any, said: Instruction[]): EndZonesReading {
    const silent = (...why: string[]): EndZonesReading => ({ said: null, silentBecause: why })
    const game = fixture?.game ?? {}
    const reading = gameReadingOf(fixture)
    const length = reading.areaLength
    const width = reading.areaWidth
    const roleBlock = fixture?.record?.roleBlock ?? null
    const marked = (regionId: string) => said.some(instruction => instruction.section === 'Set up' && instruction.status !== 'PREFERENCE' && instruction.from.includes(`space.regions[${regionId}].noun`))
    const targets: any[] = (Array.isArray(game.space?.regions) ? game.space.regions : []).filter((region: any) => reading.referencedBy(region) && !marked(String(region.elementId)))
    if (targets.length !== 2) return silent(`${targets.length} unmarked target region(s), not two`)

    const zones: EndZone[] = []
    const why: string[] = []
    for (const region of targets) {
        const regionId = String(region.elementId)
        const objective = reading.referencedBy(region)
        const along = reading.geometryFor(regionId, 'along')
        const across = reading.geometryFor(regionId, 'across')
        const span = along?.geometry?.interval
        const wide = across?.geometry?.interval
        const depth = along?.geometry?.extentBound?.requiredWithin
        const attacked = attackingEndIn(game, rendererRegister(), roleBlock, String(objective.team))
        const end = attacked === null ? null : attacked * length
        if (typeof region.noun !== 'string' || !region.noun) why.push(`${regionId}: no noun`)
        else if (reading.teamNoun(objective.team) !== null) why.push(`${regionId}: the team attacking it is named by a role`)
        else if (!span || !wide || typeof along?.path !== 'string' || typeof across?.path !== 'string') why.push(`${regionId}: no realized position`)
        else if (along.geometry.term !== ATTACKING_END) why.push(`${regionId}: not positioned at an attacking end`)
        else if (!depth || !finite(depth.min) || depth.min !== depth.max || !(depth.min > 0) || span.to - span.from !== depth.min) why.push(`${regionId}: no one required depth that its realized span has`)
        else if (end === null || !(end === 0 ? span.from === 0 : span.to === length)) why.push(`${regionId}: does not touch the end line its attacking team attacks`)
        else if (wide.from !== 0 || wide.to !== width) why.push(`${regionId}: not across the full width`)
        else zones.push({ regionId, noun: region.noun, objectiveId: String(objective.elementId), team: String(objective.team), alongPath: along.path, acrossPath: across.path, depth: depth.min, end })
    }
    if (why.length) return silent(...why)
    const [first, second] = zones
    if (first.team === second.team) return silent('one team attacks both targets')
    if (first.end === second.end) return silent('both targets lie at one end')
    if (first.depth !== second.depth) return silent('the two depths differ')
    if (first.noun !== second.noun) return silent('the two nouns differ')

    const from = [...new Set([...zones.flatMap(zone => [`space.regions[${zone.regionId}].noun`, zone.alongPath, zone.acrossPath]), ...zones.map(zone => `objectives[${zone.objectiveId}].reference`)])]
    const worded = wordedFieldRows(game).map(field => field.path)
    if (from.some(path => worded.some(field => path === field || path.startsWith(`${field}.`) || path.startsWith(`${field}[`)))) return silent('a cited path is said only in approved words')

    const statusOf = statusesOf(fixture)
    const status = strongest(zones.map(zone => statusOf.get(`space.regions[${zone.regionId}].noun`)).filter((s): s is NonNullable<typeof s> => !!s), 'DERIVED')
    const text = `Mark a ${first.depth} m end ${first.noun} across the full width at each end`
    const part: InstructionPart = { text, status, from, quantities: [first.depth], bindings: [{ quantity: first.depth, path: first.alongPath }] }
    const proposed: Instruction = { section: 'Set up', text, status, from, quantities: [first.depth], parts: [part] }
    const placed = assignSection(proposed, sectionFactsOf(fixture))
    return { said: { ...proposed, section: placed.section, when: placed.when, tier: placed.when === 'ADJUST' ? 'adjust' : 'setup', reviewOnly: REVIEW_ONLY }, silentBecause: [] }
}

/** Every review-only sentence this module says for one game, given what the renderer said. */
export function reviewStructureSentences(fixture: any, said: Instruction[]): ReviewOnlyInstruction[] {
    const zones = reciprocalEndZonesReading(fixture, said).said
    return zones ? [zones] : []
}

/**
 * **The supplement a TEST-ONLY build is handed** (the injecting option of `buildActivityUnderAuthorizationRecords`): the
 * rendering with this module's sentences added and placed as the renderer places its own (`assignSection` above, `inSectionOrder` here:
 * section order, the order said within a section). Where nothing is added, the rendering itself is returned.
 */
export function withReviewStructureWording(fixture: Record<string, unknown>, rendered: RenderedActivity): RenderedActivity {
    const added = reviewStructureSentences(fixture, rendered.instructions)
    return added.length ? { ...rendered, instructions: inSectionOrder<Instruction>([...rendered.instructions, ...added]) } : rendered
}

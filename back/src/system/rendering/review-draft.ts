/**
 * **The draft an administrator sees beside a refusal at communication — and nowhere else.** Stage K7, 15 October 2026.
 *
 * An activity that passed every check up to communication is refused there when part of it has no approved coach wording (a
 * condition, an information rule) or when fidelity finds something it cannot say faithfully. Until this stage the reviewer saw only
 * the refusal, so the sentences that ARE ready — every one an in-code DRAFT template — could not be read in context, and the
 * wording he has to approve could not be judged against the activity it belongs to. His 14 October item 7: *"Please continue
 * submitting new wording for approval under the Coach Communication Standard, but feel free to propose consolidated, more natural
 * language rather than preserving unnecessary sentence-by-sentence technical structure."* And 15 October item 11: *"Once we have that
 * activity, I want to evaluate it as a coach, particularly whether the environment offers multiple functional ways to solve the problem
 * under meaningful opposition."* (Both quoted whole since the K7 review: each had been cut mid-sentence and closed with a full stop
 * he did not write.)
 *
 * So the refusal carries, for the admin-only review response only (`buildActivityForReview` with `includeDrafts`, which the review
 * route sets from its existing administrator check), the rendering the builder already made: every sentence the renderer could say,
 * each marked APPROVED or DRAFT and with the provisional choices it rests on; every field it withheld; and the fidelity verdict on
 * it. This is the smaller alternative the verification (g-part-08) put in place of a second wording table: nothing new is rendered
 * here and nothing is served. The coach route, the pilot route and the live route never call this (a key-identity test pins it).
 *
 * Sport-neutral: it reads the fixture and the rendering, never a knowledge object by name.
 */
import { DRAFT_KNOWLEDGE } from '../derivation/types'
import { FidelityFinding } from './fidelity'
import { approvedTemplateSentences } from './approved-wording'
import { approvedSentences, Instruction, RenderedActivity, WithheldField } from './render-concrete-game'

/** One sentence as the reviewer reads it: the instruction, whose wording it is, and the provisional choices behind it. */
export interface DraftInstruction extends Instruction {
    /** APPROVED where it is a sentence of approved coach wording for this game; DRAFT otherwise (every in-code template). */
    wording: 'APPROVED' | 'DRAFT'
    /**
     * **The provisional realization choices the sentence rests on** — his 16 October item 10, *"keep those categories distinct"*, and 17
     * October: *"not treating this first realization as the canonical version of the Learning Goal."* Read from what crossed into the
     * fixture with each cited property: a derived value's supporting items labelled PROVISIONAL_REALIZATION_CHOICE (`contractId::itemId`),
     * a realization choice so labelled (`choice <lineId>`), an entailed count decided by a provisional item, and an adjustment of the
     * goal's record (`record <id>`). Empty where the sentence rests on approved knowledge, DRAFT knowledge listed in `draftSources`, and the
     * session alone.
     */
    provisionalSources: string[]
    /**
     * **The DRAFT knowledge the sentence rests on** — B2, 28 October 2026 (the review's M2). Knowledge we drafted for his review, loaded only
     * by the TEST-ONLY draft store (category DRAFT_KNOWLEDGE): a derived value's supporting draft items (`contractId::itemId`), each
     * draft item that narrowed or bounded a line a choice closed, and (B2 review) each draft item that decided an entailed count or that an
     * instantiated element satisfies. Not yet read: an item bounding a line through the register's targetOf reading or a relative bound,
     * which the review evidence reads and grades DRAFT. Kept apart from `provisionalSources`, which are his provisional choices,
     * never ours. Present only where the sentence rests on some, so a build from production knowledge carries no such key.
     */
    draftSources?: string[]
}

export interface ReviewDraft {
    /** Never served: a draft for his review. */
    status: 'DRAFT_NOT_SERVED'
    instructions: DraftInstruction[]
    /** What the game holds and no approved sentence says yet, by register row. */
    withheld: WithheldField[]
    /** The fidelity verdict on the draft rendering (each violation as the refusal's reasons word it). */
    fidelity: { passed: boolean; violations: string[] }
}

/** The provisional sources behind these paths in one fixture. */
function provisionalSourcesOf(fixture: any, paths: string[]): string[] {
    const found = new Set<string>()
    const status = fixture?.status ?? {}
    for (const path of paths) {
        for (const derived of status.derived ?? []) {
            if (derived?.path !== path) continue
            for (const support of derived.support ?? []) if (support?.category === 'PROVISIONAL_REALIZATION_CHOICE') found.add(`${support.contractId}::${support.itemId}`)
        }
        for (const choice of status.choices ?? []) if (choice?.path === path && choice.category === 'PROVISIONAL_REALIZATION_CHOICE') found.add(`choice ${choice.lineId}`)
        for (const entailed of status.entailed ?? []) {
            if (`${entailed?.collection}[].${entailed?.leaf}` !== path) continue
            // An entailment carries the items that decided it (`supportedBy`); a provisional realization is loaded as `provisional:<id>`.
            for (const ref of entailed.supportedBy ?? []) if (String(ref?.contractId).startsWith('provisional:')) found.add(`${ref.contractId}::${ref.itemId}`)
        }
        if (path.startsWith('adjustments[')) found.add(`record ${path.slice('adjustments['.length, path.indexOf(']'))}`)
        // Stage 2D named the markings set out once by his recorded choice here (`record MARK_UNION_ONCE`). Since stage 2G they rest on his
        // general presentation rule (reply filed 23 October 2026, item 2), which is no provisional choice; the regions they set out keep
        // their own provisional sources through the region paths the same sentences cite.
    }
    return [...found].sort()
}

/**
 * B2 (28 October 2026): the DRAFT knowledge behind these paths in one fixture (see `DraftInstruction.draftSources`). `draftItems` is every
 * item of the game's contracts stamped DRAFT_KNOWLEDGE (`contractId::itemId`): an entailment and an instantiation carry only the items that
 * decided them, not their category, so they are read against it (B2 review: a sentence resting on a count a draft item decided carried
 * neither draft nor provisional sources, which this field's sibling then read as approved knowledge).
 */
function draftSourcesOf(fixture: any, paths: string[], draftItems: ReadonlySet<string>): string[] {
    const found = new Set<string>()
    const status = fixture?.status ?? {}
    const keyOf = (ref: any) => `${ref?.contractId}::${ref?.itemId}`
    for (const path of paths) {
        for (const derived of status.derived ?? []) {
            if (derived?.path !== path) continue
            for (const support of derived.support ?? []) if (support?.category === DRAFT_KNOWLEDGE) found.add(keyOf(support))
        }
        for (const choice of status.choices ?? []) {
            if (choice?.path !== path) continue
            for (const ref of choice.draftShapedBy ?? []) found.add(keyOf(ref))
        }
        // As `provisionalSourcesOf` reads an entailment: through every member of its collection.
        for (const entailed of status.entailed ?? []) {
            if (`${entailed?.collection}[].${entailed?.leaf}` !== path) continue
            for (const ref of entailed.supportedBy ?? []) if (draftItems.has(keyOf(ref))) found.add(keyOf(ref))
        }
        // An element instantiated to satisfy an item (`c:<contract>:<item>`, an instance suffix dropped), on a path naming the element.
        for (const instantiation of status.instantiations ?? []) {
            const handle = String(instantiation?.handle ?? instantiation?.elementId ?? '')
            const satisfies = String(instantiation?.satisfies ?? '')
            if (!handle || !path.includes(`[${handle}]`) || !satisfies.startsWith('c:')) continue
            const bare = satisfies.slice(2).split('#')[0]
            const key = `${bare.slice(0, bare.lastIndexOf(':'))}::${bare.slice(bare.lastIndexOf(':') + 1)}`
            if (draftItems.has(key)) found.add(key)
        }
    }
    return [...found].sort()
}

/**
 * The review draft of a rendering refused at communication: `rendered` is what the renderer said (for a game in role blocks, the ONE
 * composed activity), `fixtures` the game(s) it was rendered from, `violations` every fidelity finding that refused it, and `contracts`
 * (B2 review) the contracts the games were derived from, whose DRAFT_KNOWLEDGE items an entailment or instantiation may rest on.
 */
export function reviewDraftOf(fixtures: any[], rendered: RenderedActivity, violations: FidelityFinding[], contracts: { contractId: string; items?: { itemId: string; category?: unknown }[] }[] = []): ReviewDraft {
    const draftItems = new Set(contracts.flatMap(contract => (contract.items ?? []).filter(item => item.category === DRAFT_KNOWLEDGE).map(item => `${contract.contractId}::${item.itemId}`)))
    const approved = fixtures.flatMap(fixture => approvedSentences(fixture?.game ?? {}))
    // Stage M4 (17 October 2026): a sentence that IS one of his approved template sentences, word for word, is approved wording too
    // (approved-wording.ts approvedTemplateSentences); the same template filled with any other value stays DRAFT.
    const templates = approvedTemplateSentences().map(template => template.sentence.replace(/\.$/, ''))
    const isApproved = (instruction: Instruction) =>
        templates.includes(instruction.text) ||
        approved.some(sentence => sentence.text === instruction.text && sentence.from.length === new Set(instruction.from).size && sentence.from.every(path => instruction.from.includes(path)))
    return {
        status: 'DRAFT_NOT_SERVED',
        instructions: rendered.instructions.map(instruction => {
            const cited = [...instruction.from, ...(instruction.counterparts ?? []).flatMap(entry => entry.from)]
            const draftSources = [...new Set(fixtures.flatMap(fixture => draftSourcesOf(fixture, cited, draftItems)))].sort()
            return {
                ...JSON.parse(JSON.stringify(instruction)),
                wording: isApproved(instruction) ? 'APPROVED' : 'DRAFT',
                // Stage 2C (21 October 2026): a sentence said once for blocks that say it alike by role rests on each block's own citations too.
                provisionalSources: [...new Set(fixtures.flatMap(fixture => provisionalSourcesOf(fixture, cited)))].sort(),
                ...(draftSources.length ? { draftSources } : {}),
            }
        }),
        withheld: rendered.withheld.map(field => ({ ...field })),
        fidelity: { passed: !violations.some(v => v.severity === 'VIOLATION'), violations: violations.filter(v => v.severity === 'VIOLATION').map(v => `fidelity Q${v.question}: ${v.what}`) },
    }
}

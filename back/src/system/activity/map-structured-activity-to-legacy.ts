/**
 * Maps the structured activity the model returns onto the stored/coach-facing IActivity shape.
 *
 * WHY THIS IS ITS OWN MODULE. It used to live in `completion.service.ts`, which constructs an OpenAI
 * client at module load — so importing the mapper required an API key, and a unit test therefore
 * could not touch it at all. That is not a small inconvenience: it is the reason the mapper and the
 * output validator were able to disagree completely (2026-08-16, every generation rejected) with a
 * full green test suite. The only path that exercised both was a live generation run.
 *
 * This function is pure and deterministic. Nothing here should ever reach for the model, the
 * database, or the clock beyond the timestamps below — keeping it importable without credentials is
 * what allows `assembly-output-contract.unit.ts` to prove the mapper still satisfies the validator.
 */
import type { IActivity } from '../../models/activity.model'
import type { SystemAssemblyInput } from '../types'
import { getAssemblySelectedAffordanceIds, getAssemblySelectedConstraintIds } from './assembly-package-ids'
import { reconcilePlayerFormat } from './player-format'
import type { Activity } from './activity-schema'

export function mapStructuredActivityToLegacy(activity: Activity, input: SystemAssemblyInput): IActivity {
    const selectedAffordanceIds = getAssemblySelectedAffordanceIds(input)
    const primaryId = selectedAffordanceIds[0] ?? ''
    const supportingIds = selectedAffordanceIds.slice(1)
    const constraintIds = getAssemblySelectedConstraintIds(input)

    const twoSidedExchangeRule = activity.rules[0]
    const rules = [...activity.rules]
    const scoringTrim = activity.scoring.trim()
    const firstScoringLine = scoringTrim.split(/\n/, 1)[0] || scoringTrim
    const twoSidedScoringConsequence = firstScoringLine
    const scoringSystem = scoringTrim.startsWith(twoSidedScoringConsequence) ? scoringTrim : `${twoSidedScoringConsequence} ${scoringTrim}`

    const guard = input.constraintPackage.assemblyGuardrails
    // THE THREE CONSTRAINT TITLES USED TO BE PREPENDED HERE. That put our internal object names at
    // the very front of the field a coach reads first — deterministically, on every activity, with
    // the model playing no part. Generating real activities found it in all eighteen.
    //
    // Nothing is lost by dropping them: what each constraint DOES is already carried by the visible
    // cue and by the coach-facing constraint lines. The names were only ever a handle for us.
    //
    // The output validator used to REQUIRE those titles here, so removing them rejected every
    // activity until the requirement went too. `assembly-output-contract.unit.ts` now pins the two
    // together; if you change what this field contains, that test is where it will be caught.
    // `activity.setup` IS NOT INCLUDED HERE. It used to be, and since setup also became its own
    // first-class field, every coach read the identical paragraph twice in a row — once under
    // "Constraint", once under "Setup". Verified on 6 of 6 generated activities. Constraint answers
    // "what shapes the decisions in this game"; Setup answers "how do I lay it out". One idea, one
    // section: a field that repeats its neighbour is not extra detail, it is the coach losing their
    // place.
    const constraintSummary = [guard.visibleCue.summary, activity.constraints.join(' ')].filter(Boolean).join(' ')

    // winCondition NO LONGER EMBEDS THE FIRST SCORING SENTENCE, and that fixes a defect that made
    // activities unrunnable.
    //
    // The loop: this line copied scoring's opening sentence into winCondition; the coach-facing
    // compression pass then deleted scoring sentences that duplicated winCondition. So we created
    // the duplicate and then resolved it by deleting the ORIGINAL rather than the copy. On an
    // activity whose scoring was short, that removed the only sentence saying how points are
    // scored — one real activity's entire scoring section came out as "Players face a decision —
    // attack the transition space now or hold possession", with no way to score the game at all.
    //
    // Fixed at the source of the duplication rather than by tuning the dedup: Scoring owns how
    // points are scored, winCondition frames how the game is won. One idea, one section.
    const winCondition =
        'Teams compete live under two-sided opposition, and the team with more points when play ends wins. ' +
        'The opponent inherits the connected advantage on every misread or forced action under pressure.'

    const now = new Date()
    const playerGroupSizes =
        input.session.playerCount && Number(input.session.playerCount) > 0 ? Number(input.session.playerCount) : 8

    // THE STATED FORMAT MUST FIT THE SQUAD THE COACH ENTERED. A coach with 12 players was told to
    // play "7v7 with a neutral player in each wide channel" — sixteen. Four prompt revisions failed
    // to hold that invariant, so it is enforced here instead, where it is arithmetic rather than
    // instruction-following. See player-format.ts for what each revision produced and why.
    const reconciledSetup = reconcilePlayerFormat(activity.setup, playerGroupSizes, input.archetype.name)

    const legacy = {
        title: activity.title,
        constraint: constraintSummary,
        intent: activity.objective,
        // Surface the AI-written setup description so coaches see field dimensions, zone definitions,
        // numbers, and equipment specifics rather than just generic placeholder text. Previously the
        // AI-written setup was folded into the constraint blob and lost when the blob was removed
        // from the UI; it's now a first-class field.
        setup: reconciledSetup.text,
        // How the game runs. Optional throughout: an activity generated before this section existed,
        // or one where the model omitted it, simply shows one heading fewer.
        howToPlay: activity.howToPlay ?? [],
        twoSidedExchangeRule,
        twoSidedScoringConsequence,
        playerGroupSizes,
        scaffolding: activity.coachingFocus,
        extensions: [activity.teams],
        equipmentNeeded: ['Marking cones or discs if needed for zones described in setup.'],
        rules,
        scoringSystem,
        winCondition,
        affordancesUsed: [primaryId, ...supportingIds] as any,
        constraintsUsed: constraintIds as any,
        systemTrace: {
            primaryAffordanceId: primaryId,
            supportingAffordanceIds: supportingIds,
            archetypeId: input.archetype.id,
            archetypeName: input.archetype.name,
            foundationConstraintId: input.constraintPackage.foundation.constraint._id,
            shapingConstraintId: input.constraintPackage.shaping.constraint._id,
            consequenceConstraintId: input.constraintPackage.consequence?.constraint._id,
            // IC-003 Invariant 5. Recorded on the activity itself rather than left to be joined from
            // telemetry by session — an activity a coach disputes should carry its own provenance.
            planning: {
                learningGoalId: input.coachInput.learningGoalId,
                learningGoalName: input.coachInput.learningGoals?.[0],
                practiceSituationId: input.coachInput.practiceSituation?.id,
                practiceSituationName: input.coachInput.practiceSituation?.name,
                learningStage: input.coachInput.learningStage,
                challengeLevel: input.coachInput.challengeLevel,
            },
        },
        createdAt: now,
        updatedAt: now,
    } as IActivity & { twoSidedExchangeRule: string; twoSidedScoringConsequence: string }

    return legacy as IActivity
}

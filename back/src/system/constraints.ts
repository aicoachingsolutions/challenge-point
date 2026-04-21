import { Types } from 'mongoose'

import { ConstraintRoles } from '../models/constraint.model'

export type ConstraintRegistryEntry = {
    id: string
    title: string
    description: string
    type: string
    affordanceTagGroup: string
    designIntent: string
    constraintRole: ConstraintRoles
    constraintArchetype?: string
    notes?: string
    contextualAudit?: string
    suggestedConstraintPrompt?: string
    gameTemplateAnchor?: string
    categoryName?: string
}

// Canonical constraint library for the system-led generator.
// Mongo is the synced runtime store, but this registry is the source of truth.
export const CONSTRAINT_REGISTRY: ConstraintRegistryEntry[] = [
    {
        id: '6620f2200000000000000001',
        title: 'Directional Breakthrough Field',
        description:
            'Directional teams game with target spaces beyond the first line so players must organize forward routes and recognize chances to break through.',
        type: 'field structure',
        affordanceTagGroup: 'progress',
        designIntent:
            'Shape the field to present line-breaking and forward progression opportunities without prescribing one pattern.',
        constraintRole: ConstraintRoles.Foundation,
        constraintArchetype: 'progression-breakthrough',
        notes: 'Builds a directional environment with targets and clear forward reference points.',
        contextualAudit: 'Supports progress, penetrate, break line, advance, and play forward learning goals.',
        suggestedConstraintPrompt: 'Use directional spaces and targets that reward penetrating through or beyond pressure.',
        gameTemplateAnchor: 'Directional game with a defended middle zone and clear target spaces behind pressure.',
    },
    {
        id: '6620f2200000000000000002',
        title: 'Forward Entry Trigger',
        description:
            'A breakthrough counts only when the receiving player takes the ball through a line or into a target lane with support connected behind the ball.',
        type: 'progress trigger',
        affordanceTagGroup: 'progress',
        designIntent:
            'Reward meaningful forward progression and connected support timing while preserving several ways to break through.',
        constraintRole: ConstraintRoles.Shaping,
        constraintArchetype: 'progression-breakthrough',
        notes: 'Encourages recognition of when to play through, around, or beyond the line.',
        contextualAudit: 'Helps the game keep a forward focus without forcing a single pass type.',
        suggestedConstraintPrompt: 'Reward line-breaking entries and connected support rather than raw possession volume.',
        gameTemplateAnchor: 'Players can break a line by carrying, combining, or receiving into the lane.',
    },
    {
        id: '6620f2200000000000000003',
        title: 'Breakthrough Bonus Point',
        description:
            'Teams score a bonus point when they break a line and keep the next action alive, while failed forced entries restart possession for the opponent.',
        type: 'scoring consequence',
        affordanceTagGroup: 'progress',
        designIntent:
            'Make successful progression meaningful and keep consequence tied to the quality of the breakthrough action.',
        constraintRole: ConstraintRoles.Consequence,
        constraintArchetype: 'progression-breakthrough',
        notes: 'Keeps consequence tied to forward entry quality rather than isolated possession counts.',
        contextualAudit: 'Useful when the session should reward decisive forward action and punish rushed forcing.',
        suggestedConstraintPrompt: 'Reward live breakthrough continuation and penalize low-quality forced entries.',
        gameTemplateAnchor: 'Bonus point for clean breakthrough and continuation, restart for the opponent after forced loss.',
    },
    {
        id: '6620f2200000000000000004',
        title: 'Stretch the Pitch',
        description:
            'Game with wide channels and interior overload zones that reorganize the field and invite players to discover width, depth, and switching options.',
        type: 'field structure',
        affordanceTagGroup: 'space',
        designIntent:
            'Create a game where players must stretch, support, and reorganize space without a prescribed circulation pattern.',
        constraintRole: ConstraintRoles.Foundation,
        constraintArchetype: 'space-creation',
        notes: 'Creates natural cues for width, depth, support timing, and overload release.',
        contextualAudit: 'Supports create space, width, depth, support, overload, and switch learning goals.',
        suggestedConstraintPrompt: 'Use the field layout to make free space visible and worthwhile to exploit.',
        gameTemplateAnchor: 'Game with wide release spaces and central overload pressure.',
    },
    {
        id: '6620f2200000000000000005',
        title: 'Switch or Release Condition',
        description:
            'A team can score only after switching into a free area or releasing an overload into the far side, with players free to choose the route and timing.',
        type: 'switching condition',
        affordanceTagGroup: 'space',
        designIntent:
            'Reward exploiting newly created space and overload release while keeping several options open in the build-up.',
        constraintRole: ConstraintRoles.Shaping,
        constraintArchetype: 'space-creation',
        notes: 'Encourages players to identify when to hold, switch, or release an overload.',
        contextualAudit: 'Useful when learning should emphasize support timing, switching, and exploiting the free side.',
        suggestedConstraintPrompt: 'Make exploitation of open space valuable without dictating the exact sequence.',
        gameTemplateAnchor: 'Teams can attack either side but must exploit the free side before finishing.',
    },
    {
        id: '6620f2200000000000000006',
        title: 'Open Space Reward',
        description:
            'Teams win an extra point when they exploit a clearly open area after a switch or overload release, while crowded entries restart for the opponent.',
        type: 'space consequence',
        affordanceTagGroup: 'space',
        designIntent:
            'Connect the consequence to how well players identify and use free space rather than merely completing passes.',
        constraintRole: ConstraintRoles.Consequence,
        constraintArchetype: 'space-creation',
        notes: 'Reinforces recognition and use of free space as part of the live game outcome.',
        contextualAudit: 'Useful when exploitation of space should carry immediate game value.',
        suggestedConstraintPrompt: 'Reward clear space exploitation and punish forcing into congestion.',
        gameTemplateAnchor: 'Bonus point for entering the free side or open lane under control.',
    },
    {
        id: '6620f2200000000000000007',
        title: 'Final Action Game',
        description:
            'Attacking game built around repeated entries into a finishing zone where players must create chances and choose how to finish under pressure.',
        type: 'field structure',
        affordanceTagGroup: 'finish',
        designIntent:
            'Create repeated final-third moments where players must decide on the best finishing route instead of rehearsing one pattern.',
        constraintRole: ConstraintRoles.Foundation,
        constraintArchetype: 'finishing-pressure',
        notes: 'Preserves varied finishing routes and different support pictures around goal.',
        contextualAudit: 'Supports finish, score, shoot, chance creation, and final-third learning goals.',
        suggestedConstraintPrompt: 'Create repeated final-action moments that preserve finishing choice.',
        gameTemplateAnchor: 'Directional game with a pressured finishing zone and immediate second actions.',
    },
    {
        id: '6620f2200000000000000008',
        title: 'Second-Action Finishing Rule',
        description:
            'Goals count only after a live second action, rebound, cut-back, or supporting run, so players must decide whether to finish early or create a better final picture.',
        type: 'finishing condition',
        affordanceTagGroup: 'finish',
        designIntent:
            'Reward composed finishing and timing of support while leaving multiple finishing solutions available.',
        constraintRole: ConstraintRoles.Shaping,
        constraintArchetype: 'finishing-pressure',
        notes: 'Keeps the game from collapsing into rushed first-shot behaviour.',
        contextualAudit: 'Useful when the session should value quality chance creation and second actions.',
        suggestedConstraintPrompt: 'Reward quality final actions and supporting movements rather than rushed shooting.',
        gameTemplateAnchor: 'Finishing phase where rebounds, cut-backs, and support timing all matter.',
    },
    {
        id: '6620f2200000000000000009',
        title: 'Quality Chance Bonus',
        description:
            'Teams receive a bonus point for goals scored from a clearly prepared quality chance, while rushed low-quality shots transfer possession to the opponent.',
        type: 'finishing consequence',
        affordanceTagGroup: 'finish',
        designIntent:
            'Make consequence reflect the quality of the finishing moment and not only the existence of a shot.',
        constraintRole: ConstraintRoles.Consequence,
        constraintArchetype: 'finishing-pressure',
        notes: 'Rewards efficient finishing and punishes poor final decisions in the live game.',
        contextualAudit: 'Useful when efficient finishing and chance quality should shape behaviour.',
        suggestedConstraintPrompt: 'Use scoring consequences that value quality chances and efficient finishing.',
        gameTemplateAnchor: 'Bonus point for prepared finish, restart or loss of turn after rushed shots.',
    },
    {
        id: '6620f2200000000000000010',
        title: 'Regain and React Game',
        description:
            'Transition game with unstable numbers after every regain or turnover so players must attack or protect the next moment immediately.',
        type: 'transition field structure',
        affordanceTagGroup: 'transition',
        designIntent:
            'Expose players to the unstable transition picture where choices after regains or losses determine the outcome.',
        constraintRole: ConstraintRoles.Foundation,
        constraintArchetype: 'transition-chaos',
        notes: 'Builds immediate attack, protect, recover, and press decisions into the game flow.',
        contextualAudit: 'Supports transition, regain, counter, recover, and press learning goals.',
        suggestedConstraintPrompt: 'Keep unstable moments frequent so reaction speed and choice shape success.',
        gameTemplateAnchor: 'Game where every turnover immediately changes numbers or direction of attack.',
    },
    {
        id: '6620f2200000000000000011',
        title: 'Immediate Exploitation Window',
        description:
            'After a regain, the team has a short live window to counter or secure the ball before the game resets into balanced pressure.',
        type: 'transition condition',
        affordanceTagGroup: 'transition',
        designIntent:
            'Reward quick recognition of the transition picture while preserving the choice between immediate attack and secure control.',
        constraintRole: ConstraintRoles.Shaping,
        constraintArchetype: 'transition-chaos',
        notes: 'Makes transition windows meaningful without forcing an automatic direct attack.',
        contextualAudit: 'Useful when learning should emphasize the first decision after winning or losing the ball.',
        suggestedConstraintPrompt: 'Create a live advantage window after regain and let players decide how to exploit it.',
        gameTemplateAnchor: 'Regain creates a temporary attacking window before defensive recovery completes.',
    },
    {
        id: '6620f2200000000000000012',
        title: 'Transition Reward or Penalty',
        description:
            'Teams earn a bonus point for immediate exploitation after a regain, while slow reactions or careless losses trigger a restart or penalty against them.',
        type: 'transition consequence',
        affordanceTagGroup: 'transition',
        designIntent:
            'Tie consequence directly to how well players react during unstable transition moments.',
        constraintRole: ConstraintRoles.Consequence,
        constraintArchetype: 'transition-chaos',
        notes: 'Rewards quick exploitation and penalizes slow or careless transition responses.',
        contextualAudit: 'Useful when transition reactions should drive the main game consequence.',
        suggestedConstraintPrompt: 'Reward fast exploitation and penalize delayed or poor transition decisions.',
        gameTemplateAnchor: 'Bonus for fast regain exploitation, restart or penalty for slow response.',
    },
    {
        id: '6620f2200000000000000013',
        title: 'Build Under Pressure',
        description:
            'Build-up game where one team must secure the ball and escape pressure through connected support before progressing out.',
        type: 'build structure',
        affordanceTagGroup: 'retain',
        designIntent:
            'Create repeated moments to secure possession, use support, and build out without prescribing one escape route.',
        constraintRole: ConstraintRoles.Foundation,
        constraintArchetype: 'protect-build',
        notes: 'Supports retain, secure, recycle, protect, build, and escape-pressure decisions.',
        contextualAudit: 'Useful when learning goals emphasize keeping the ball and building out under pressure.',
        suggestedConstraintPrompt: 'Preserve several escape routes while making support and control essential.',
        gameTemplateAnchor: 'Game where the team in possession must escape pressure into a progression zone.',
    },
    {
        id: '6620f2200000000000000014',
        title: 'Secure Before Progress Condition',
        description:
            'A team can progress only after securing a connected support picture, so players must decide when to keep, recycle, or escape rather than forcing the first outlet.',
        type: 'retention condition',
        affordanceTagGroup: 'retain',
        designIntent:
            'Reward secure possession and support connection before progression while keeping multiple solutions available.',
        constraintRole: ConstraintRoles.Shaping,
        constraintArchetype: 'protect-build',
        notes: 'Encourages support angles, patience, and clean exits without fixed passing patterns.',
        contextualAudit: 'Useful when the session should value secure control before progression.',
        suggestedConstraintPrompt: 'Reward clean support pictures and exits rather than rushed release.',
        gameTemplateAnchor: 'Progression is unlocked after the team secures a connected support picture.',
    },
    {
        id: '6620f2200000000000000015',
        title: 'Clean Exit Reward',
        description:
            'Teams earn a bonus point for escaping pressure cleanly into space, while forced turnovers or panicked clearances restart with pressure against them.',
        type: 'build consequence',
        affordanceTagGroup: 'retain',
        designIntent:
            'Make the consequence depend on how well players secure and escape pressure rather than simply surviving the moment.',
        constraintRole: ConstraintRoles.Consequence,
        constraintArchetype: 'protect-build',
        notes: 'Rewards composed exits and penalizes careless or panicked release under pressure.',
        contextualAudit: 'Useful when clean build-out should have a meaningful game consequence.',
        suggestedConstraintPrompt: 'Reward secure exits and penalize forced turnovers under pressure.',
        gameTemplateAnchor: 'Bonus for composed exit, restart under pressure after turnover.',
    },
    {
        id: '6620f2200000000000000016',
        title: 'Protect the Central Lane',
        description:
            'Defending game where teams must protect central space and delay penetration before they can regain or clear.',
        type: 'defensive structure',
        affordanceTagGroup: 'protect',
        designIntent:
            'Shape the game around delaying, covering, and protecting important spaces without prescribing one defensive action.',
        constraintRole: ConstraintRoles.Foundation,
        constraintArchetype: 'protect-build',
        notes: 'Creates repeated moments to protect space, cover, delay, and stay connected defensively.',
        contextualAudit: 'Useful when learning goals emphasize protect, defend, cover, delay, or compactness.',
        suggestedConstraintPrompt: 'Make protecting key spaces the central game problem before regain.',
        gameTemplateAnchor: 'Game where defenders must protect the central route before transitioning out.',
    },
    {
        id: '6620f2200000000000000017',
        title: 'Delay and Recover Condition',
        description:
            'The defending team is rewarded only if it delays the attack long enough for cover to arrive, allowing players to choose how to block, delay, or recover together.',
        type: 'defensive condition',
        affordanceTagGroup: 'protect',
        designIntent:
            'Reward connected delay and recovery behaviour while preserving multiple defensive solutions.',
        constraintRole: ConstraintRoles.Shaping,
        constraintArchetype: 'protect-build',
        notes: 'Encourages delay, cover, blocking, and compact support around key space.',
        contextualAudit: 'Useful when the session should value collective protection before the regain.',
        suggestedConstraintPrompt: 'Reward successful delay and cover instead of isolated individual defending.',
        gameTemplateAnchor: 'Attackers can score quickly, but defenders gain value by delaying and recovering together.',
    },
    {
        id: '6620f2200000000000000018',
        title: 'Protective Recovery Reward',
        description:
            'Teams earn a bonus point when they regain after successfully delaying and protecting the key space, while direct central concessions carry a penalty restart.',
        type: 'defensive consequence',
        affordanceTagGroup: 'protect',
        designIntent:
            'Tie consequence to how well the team protects space and recovers together before the regain.',
        constraintRole: ConstraintRoles.Consequence,
        constraintArchetype: 'protect-build',
        notes: 'Rewards collective protection and penalizes direct concessions through the key space.',
        contextualAudit: 'Useful when space protection and recovery quality should decide the consequence.',
        suggestedConstraintPrompt: 'Reward successful protective regains and penalize direct breakdowns.',
        gameTemplateAnchor: 'Bonus for regain after delay, penalty restart after direct concession.',
    },
]

export function getConstraintRegistryObjectIds(): Types.ObjectId[] {
    return CONSTRAINT_REGISTRY.map((entry) => new Types.ObjectId(entry.id))
}


import { Types } from 'mongoose'

export type AffordanceRegistryEntry = {
    id: string
    title: string
    description: string
    type: string
    affordanceTagGroup: string
    designIntent: string
    constraintArchetype?: string
    notes?: string
    contextualAudit?: string
    suggestedConstraintPrompt?: string
    gameTemplateAnchor?: string
    categoryName?: string
}

// Canonical affordance library for the system-led generator.
// Mongo is the synced runtime store, but this registry is the source of truth.
export const AFFORDANCE_REGISTRY: AffordanceRegistryEntry[] = [
    {
        id: '6610f1100000000000000001',
        title: 'Progress Through Lines',
        description:
            'Game moments that invite players to penetrate, break lines, play forward, and advance into space behind pressure.',
        type: 'attacking progression',
        affordanceTagGroup: 'progress',
        designIntent:
            'Create repeated opportunities to recognize and exploit forward routes without prescribing a single passing pattern.',
        constraintArchetype: 'progression-breakthrough',
        notes: 'Supports line-breaking actions, forward timing, and progression under realistic pressure.',
        contextualAudit: 'Useful when learning goals emphasise penetrate, progress, play forward, or break lines.',
        suggestedConstraintPrompt: 'Reward forward entries and line-breaking moments while preserving multiple routes.',
        gameTemplateAnchor: 'Directional game with opportunities to progress through, around, or beyond pressure.',
    },
    {
        id: '6610f1100000000000000002',
        title: 'Create and Exploit Space',
        description:
            'Interactions that stretch the field, create width and depth, support overloads, and reveal switching options.',
        type: 'space creation',
        affordanceTagGroup: 'space',
        designIntent:
            'Help players discover multiple ways to make and use space through support, width, depth, and overload release.',
        constraintArchetype: 'space-creation',
        notes: 'Supports width, depth, switching, support timing, overloads, and spatial reorganisation.',
        contextualAudit: 'Useful when learning goals mention create space, support, width, depth, overload, or switch.',
        suggestedConstraintPrompt: 'Keep the field stretchable and reward finding free space rather than fixed patterns.',
        gameTemplateAnchor: 'Game where players must reorganise the field to uncover free players or free space.',
    },
    {
        id: '6610f1100000000000000003',
        title: 'Finish Under Pressure',
        description:
            'Moments near goal where players must create chances, score, and decide between different finishing routes under pressure.',
        type: 'finishing',
        affordanceTagGroup: 'finish',
        designIntent:
            'Increase the value of the end product while keeping choice in the final action and timing of support around the goal.',
        constraintArchetype: 'finishing-pressure',
        notes: 'Supports chance creation, finishing timing, second actions, and efficient end product.',
        contextualAudit: 'Useful when learning goals mention finish, score, shoot, chance creation, or final third actions.',
        suggestedConstraintPrompt: 'Make chances and finishing consequences matter without prescribing one final action.',
        gameTemplateAnchor: 'Game where players arrive in finishing situations through several possible routes.',
    },
    {
        id: '6610f1100000000000000004',
        title: 'Attack the Transition',
        description:
            'Unstable regain and turnover moments where players can counter, recover, press, or exploit temporary numerical advantages.',
        type: 'transition',
        affordanceTagGroup: 'transition',
        designIntent:
            'Expose players to immediate decisions after regains or losses so the consequence of fast reactions drives learning.',
        constraintArchetype: 'transition-chaos',
        notes: 'Supports regain, turnover, counter, press, recover, and fast exploitation after transitions.',
        contextualAudit: 'Useful when learning goals mention transition, counter, regain, recover, or pressing responses.',
        suggestedConstraintPrompt: 'Make transition consequences immediate so players must react to changing game states.',
        gameTemplateAnchor: 'Game with frequent regain and loss moments that change the advantage quickly.',
    },
    {
        id: '6610f1100000000000000005',
        title: 'Secure and Escape Pressure',
        description:
            'Build-up moments where players retain, secure, protect, and escape pressure before progressing into better space.',
        type: 'retention and build',
        affordanceTagGroup: 'retain',
        designIntent:
            'Preserve choice while inviting players to secure possession, use support angles, and build out under pressure.',
        constraintArchetype: 'protect-build',
        notes: 'Supports retain, protect, build, secure, recycle, and escape pressure with support.',
        contextualAudit: 'Useful when learning goals mention retain possession, secure the ball, recycle, or build out.',
        suggestedConstraintPrompt: 'Reward clean exits and secure support without forcing one release pattern.',
        gameTemplateAnchor: 'Game where teams must survive pressure, connect support, and then progress out.',
    },
    {
        id: '6610f1100000000000000006',
        title: 'Protect the Critical Space',
        description:
            'Defensive moments that invite players to delay, cover, compact, block, and protect central space while staying connected.',
        type: 'defensive protection',
        affordanceTagGroup: 'protect',
        designIntent:
            'Help players coordinate protective defensive behaviour around key spaces without dictating a single defensive action.',
        constraintArchetype: 'protect-build',
        notes: 'Supports defend, protect, cover, compactness, delay, blocking routes, and preserving team connections.',
        contextualAudit: 'Useful when learning goals mention protect, defend, delay, cover, block, or stay compact.',
        suggestedConstraintPrompt: 'Protect key spaces and connected defending behaviour while preserving player decisions.',
        gameTemplateAnchor: 'Game where the defending team must protect important space before regaining or clearing.',
    },
]

export function getAffordanceRegistryObjectIds(): Types.ObjectId[] {
    return AFFORDANCE_REGISTRY.map((entry) => new Types.ObjectId(entry.id))
}


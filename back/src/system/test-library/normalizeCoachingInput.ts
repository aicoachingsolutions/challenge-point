/**
 * Rewrites skill-heavy coach phrasing into ecological, game-based language so
 * deterministic Test Library selection can token-match archetypes, lenses, and constraints.
 * Does not replace blocked out-of-scope phrases — callers must still run allow-list checks on raw input first.
 */

const PHRASE_REWRITES: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
    {
        pattern: /\bpassing accuracy\b/gi,
        replacement: 'players deciding when and where to pass under pressure to maintain or break structure',
    },
    {
        pattern: /\bpass accuracy\b/gi,
        replacement: 'players deciding when and where to pass under pressure to maintain or break structure',
    },
    {
        pattern: /\bfinishing accuracy\b/gi,
        replacement:
            'players deciding when to shoot or combine under defender pressure in live attacking play',
    },
    {
        pattern: /\btouches under pressure\b/gi,
        replacement:
            'players receiving under pressure and deciding how to maintain possession or exploit space',
    },
    {
        pattern: /\btouch under pressure\b/gi,
        replacement:
            'players receiving under pressure and deciding how to maintain possession or exploit space',
    },
    {
        pattern: /\btouches with pressure\b/gi,
        replacement:
            'players receiving under pressure and deciding how to maintain possession or exploit space',
    },
    {
        pattern: /\bfirst touches?\b/gi,
        replacement: 'receiving under live opposition and deciding how to secure or redirect the ball',
    },
    {
        pattern: /\bwork on touches\b/gi,
        replacement: 'opposed play where players receive the ball and decide how to use possession',
    },
    {
        pattern: /\bball mastery\b/gi,
        replacement:
            'on-ball actions in opposed games where defenders force reads and players choose when to protect, combine, or break lines',
    },
    {
        pattern: /\bshooting drills?\b/gi,
        replacement:
            'finishing under live defender pressure where players choose shot timing and supporting options',
    },
    {
        pattern: /\bshooting\b/gi,
        replacement: 'finishing under opponent pressure with decisions on when to shoot or combine in live play',
    },
    {
        pattern: /\bdribbling skills?\b/gi,
        replacement:
            'carrying the ball under defender pressure with decisions when to drive, release, or protect in opposed play',
    },
    {
        pattern: /\bpassing drills?\b/gi,
        replacement:
            'passing choices in opposed possession where defenders dictate when to play safe or break structure',
    },
    {
        pattern: /\bpossession passing\b/gi,
        replacement:
            'circulating the ball against active opponents who press and force passing decisions',
    },
    {
        pattern: /\btrapping\b/gi,
        replacement: 'receiving and securing the ball under opponent pressure with live next-play reads',
    },
    {
        pattern: /\bcontrol the ball\b/gi,
        replacement: 'keeping the ball under live defender pressure while reading when to secure or release',
    },
]

/** Word-boundary "dribble" / "dribbling" not already covered by longer phrases above. */
const DRIBBLE_TAIL: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\bdribbling\b/gi, replacement: 'on-ball carries under opponent pressure with live decisions' },
    { pattern: /\bdribble\b/gi, replacement: 'on-ball carries under opponent pressure with live decisions' },
]

/**
 * Heuristic: text already reads like opposed play / games / pressing contexts.
 */
function hasEcologicalAnchor(s: string): boolean {
    return /\b(opponent|defenders?|defensive|press|pressing|pressure|regain|rondo|ssg|small[- ]sided|live play|possession game|transition|break|overload|marking|game|games)\b/i.test(
        s
    )
}

/**
 * Residual skill-ish tokens worth nudging with an ecological suffix if still missing anchors.
 */
function needsEcologicalSuffix(s: string): boolean {
    return /\b(touches?|passing|technique|accuracy|dribbling|dribble|trapping|shooting|1v1|one[- ]on[- ]one)\b/i.test(
        s
    )
}

export function normalizeCoachingInput(input: string): string {
    let s = input.trim()
    if (!s) {
        return s
    }

    for (const { pattern, replacement } of PHRASE_REWRITES) {
        s = s.replace(pattern, replacement)
    }

    for (const { pattern, replacement } of DRIBBLE_TAIL) {
        s = s.replace(pattern, replacement)
    }

    if (/\bpassing\b/i.test(s) && !/\bopponent pressure\b/i.test(s)) {
        s = s.replace(/\bpassing\b/gi, 'passing decisions under opponent pressure')
    }

    if (needsEcologicalSuffix(s) && !hasEcologicalAnchor(s)) {
        s = `${s} In opposed play, defenders apply pressure so players must read when to secure possession, combine, or exploit space.`
    }

    return s.replace(/\s+/g, ' ').trim()
}

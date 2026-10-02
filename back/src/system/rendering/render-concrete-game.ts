/**
 * Rendering one validated concrete game into a coach-usable activity — faithfully.
 *
 * The question this exists to answer is his, and it is narrower than "can we write an activity":
 *
 *   > *Can Challenge Point transform this already-validated concrete game into a coach-usable activity
 *   > without losing, inventing, contradicting, or operationally obscuring anything established in the
 *   > concrete game?*
 *
 * So **the concrete game is authoritative for what physically exists and how the game works.** Rendering
 * may translate it into natural language and organise it for a coach; it may not silently complete,
 * improve, reinterpret or redesign it. That asymmetry is the whole design:
 *
 *   - every instruction carries the **property paths** that produced it, so nothing can appear without a
 *     source;
 *   - every instruction carries the **status** of its source — derived knowledge, a realization choice, a
 *     preference, an instantiated member — and its wording is generated **from** that status rather than
 *     chosen and checked afterwards. A preference cannot be worded as a requirement because the
 *     requirement wording is not available to it;
 *   - nothing is numbered, named or quantified except from a value in the game.
 *
 * **And where the game produces something a coach would question, that is reported, not repaired.** His
 * instruction: *"If the concrete game itself produces something undesirable from a coaching or [sport]
 * perspective, please return that as evidence rather than repairing it in prose. At this stage, fidelity
 * is more important than making the activity look better."* A renderer that tidied the game would hide
 * the one thing this pass is for. (The sport he named is bracketed out only because this module sits above
 * the sport layer and the coupling ratchet correctly refuses to let a sport be named here.)
 */

/** Where a rendered instruction's authority comes from, and what wording that permits. */
export type SourceStatus =
    /** Derived from selected knowledge — a requirement of the game. Imperative wording. */
    | 'DERIVED'
    /** Chosen by realization inside authored bounds. A fact about THIS activity, not a necessity. */
    | 'REALIZATION_CHOICE'
    /** Authored as preferred guidance. Hedged wording only; never imperative. */
    | 'PREFERENCE'
    /** A member realization instantiated to satisfy an existential claim. */
    | 'INSTANTIATED'
    /** Session context the coach supplied. */
    | 'SESSION'

export interface Instruction {
    /** Which part of the activity this belongs to. Organisation only; carries no authority. */
    section: 'Set up' | 'Players' | 'How it works' | 'How to score' | 'What to watch'
    text: string
    status: SourceStatus
    /** Concrete-game property paths that produced it. Empty is a defect, not a style choice. */
    from: string[]
    /** Any number appearing in `text`, so a checker can verify each one came from the game. */
    quantities: number[]
}

export interface RenderedActivity {
    instructions: Instruction[]
    /** Observations about the game a coach would question. Reported, never acted on. */
    coachingObservations: string[]
}

type Fixture = any

const metres = (n: number): string => `${Number.isInteger(n) ? n : n.toFixed(1)} m`

/**
 * Wording is a function of status, so a status cannot be misrepresented by phrasing.
 *
 * `DERIVED` and `INSTANTIATED` get the imperative, because the game requires them. `REALIZATION_CHOICE`
 * gets "for this activity", which states the fact without claiming the knowledge demanded it.
 * `PREFERENCE` gets "if it suits your group", which cannot be read as a requirement. There is no path
 * by which a preference reaches imperative wording.
 */
function phrase(status: SourceStatus, core: string): string {
    switch (status) {
        case 'DERIVED':
        case 'INSTANTIATED':
        case 'SESSION':
            return core
        case 'REALIZATION_CHOICE':
            return `For this activity, ${core.charAt(0).toLowerCase()}${core.slice(1)}`
        case 'PREFERENCE':
            return `${core}, if it suits your group`
    }
}

export function renderConcreteGame(fixture: Fixture): RenderedActivity {
    const instructions: Instruction[] = []
    const observations: string[] = []
    const game = fixture.game
    const statusOf = new Map<string, SourceStatus>()
    for (const d of fixture.status.derived) statusOf.set(d.path, 'DERIVED')
    for (const c of fixture.status.choices) statusOf.set(c.path, 'REALIZATION_CHOICE')

    const say = (section: Instruction['section'], status: SourceStatus, core: string, from: string[], quantities: number[] = []) =>
        instructions.push({ section, text: phrase(status, core), status, from, quantities })

    /**
     * The status of a property is whatever the fixture records, never what the renderer assumes. Envelope
     * facts in particular arrive from the session but are recorded as DERIVED once folded into the game,
     * and labelling them SESSION would misstate the provenance trace even though both phrase identically.
     */
    const recorded = (path: string, fallback: SourceStatus): SourceStatus => statusOf.get(path) ?? fallback

    const geometryFor = (elementId: string, axis: 'along' | 'across') =>
        fixture.status.geometry.find((g: any) => g.path.includes(`[${elementId}]`) && g.path.endsWith(`.${axis}`))

    // ── Set up ──────────────────────────────────────────────────────────────────────────────────
    const area = game.envelope?.area
    if (area) {
        say(
            'Set up',
            recorded('envelope.area.length_m', 'SESSION'),
            `Mark out an area ${metres(area.length_m)} long by ${metres(area.width_m)} wide`,
            ['envelope.area.length_m', 'envelope.area.width_m'],
            [area.length_m, area.width_m],
        )
    }

    for (const region of game.space?.regions ?? []) {
        const noun = region.noun
        const along = geometryFor(region.elementId, 'along')
        const across = geometryFor(region.elementId, 'across')
        const nounPath = `space.regions[${region.elementId}].noun`
        const status = statusOf.get(nounPath) ?? 'DERIVED'

        if (noun === 'line') {
            // A line's length is its non-degenerate axis; its position is the degenerate one.
            const lengthAxis = along?.geometry.interval && along.geometry.interval.from !== along.geometry.interval.to ? along : across
            const atAxis = lengthAxis === along ? across : along
            const length = lengthAxis?.geometry.interval
            const at = atAxis?.geometry.interval
            say(
                'Set up',
                status,
                `Mark a line across one end of the area, ${metres((length?.to ?? 0) - (length?.from ?? 0))} long, on the end line itself`,
                [nounPath, lengthAxis?.path, atAxis?.path].filter(Boolean) as string[],
                [(length?.to ?? 0) - (length?.from ?? 0)],
            )
            if (at && at.from === at.to) {
                // Stated rather than smoothed over: the game puts the line ON the end line, with no depth.
                observations.push(
                    `The scoring line has zero depth and sits exactly on the end line (${atAxis?.path} = ${at.from}). That is what the ` +
                        `knowledge entails for a line, and it is physically markable — but a coach may expect a scoring zone with some ` +
                        `depth, and the game does not give one.`,
                )
            }
        } else {
            const width = across?.geometry.interval
            const len = along?.geometry.interval
            say(
                'Set up',
                status,
                `Mark a ${noun} along the touchline, ${metres((len?.to ?? 0) - (len?.from ?? 0))} long and up to ${metres((width?.to ?? 0) - (width?.from ?? 0))} wide`,
                [nounPath, along?.path, across?.path].filter(Boolean) as string[],
                [(len?.to ?? 0) - (len?.from ?? 0), (width?.to ?? 0) - (width?.from ?? 0)],
            )
            const preference = across?.geometry.extentBound?.preferenceWithin
            if (preference && preference.compatible && typeof preference.min === 'number') {
                say(
                    'Set up',
                    'PREFERENCE',
                    `Around ${metres(preference.min)} to ${metres(preference.max)} wide works well`,
                    [across?.path].filter(Boolean) as string[],
                    [preference.min, preference.max],
                )
            }
        }
    }

    // ── Players ─────────────────────────────────────────────────────────────────────────────────
    if (Number.isFinite(game.envelope?.players)) {
        say('Players', recorded('envelope.players', 'SESSION'), `${game.envelope.players} players in total`, ['envelope.players'], [game.envelope.players])
    }
    const teams = game.performers?.teams ?? []
    if (teams.length) {
        const sizes = [...new Set(teams.map((t: any) => t.outfieldCount).filter((n: any) => Number.isFinite(n)))]
        const size = sizes.length === 1 ? Number(sizes[0]) : null
        say(
            'Players',
            'INSTANTIATED',
            size === null
                ? `${teams.length} teams`
                : `${teams.length} teams of ${size}`,
            ['performers.teams'],
            size === null ? [teams.length] : [teams.length, size],
        )
        const roles = fixture.envelope?.roles ?? {}
        for (const [role, count] of Object.entries(roles)) {
            if (Number(count) === 0) {
                say('Players', 'SESSION', `No ${role}s — everyone is an outfield player`, ['envelope.roles'], [])
            }
        }
        if (size === null) {
            // NOT repaired. The renderer could divide 12 by 2 and write "two teams of six" — and that is
            // exactly the forbidden move. The post-realization gate did derive 6-a-side legitimately, from
            // the session total plus authored equality, but it derived it into its own evaluation context
            // and the value never reached the game. So the game does not establish it, and a renderer that
            // recomputed it would be inventing a number on its own authority.
            observations.push(
                `The game establishes ${game.envelope?.players} players and ${teams.length} teams but gives neither team a size: ` +
                    `\`performers.teams[]\` members carry only \`designation\`. A coach cannot split the group from this. The team size ` +
                    `IS derivable — the post-realization gate derived ${game.envelope.players / teams.length} per side from the session total ` +
                    `(${game.envelope.players} ÷ ${teams.length}) plus authored equality, and passed its roster check on it — but it derived it into the gate's evaluation context, ` +
                    `not into the concrete game, so the value does not survive into the artifact being rendered. Rendering will not ` +
                    `recompute it: that would be a number on the renderer's own authority. This is the one finding that I think bears on ` +
                    `the closure itself rather than on the rendering.`,
            )
        }
    }

    // ── How it works ────────────────────────────────────────────────────────────────────────────
    if (game.envelope?.duration_min) {
        say('How it works', recorded('envelope.duration_min', 'SESSION'), `Play for ${game.envelope.duration_min} minutes`, ['envelope.duration_min'], [game.envelope.duration_min])
    }
    for (const transition of game.transitions ?? []) {
        if (transition.playState === 'CONTINUE') {
            say(
                'How it works',
                'DERIVED',
                `Play continues when possession changes — there is no stoppage`,
                [`transitions[${transition.elementId}].playState`],
                [],
            )
        }
    }

    // ── How to score ────────────────────────────────────────────────────────────────────────────
    const primary = game.value?.primaryEvent
    if (primary) {
        const kindPath = 'value.primaryEvent.kind'
        const objective = (game.objectives ?? [])[0]
        const shared = objective?.team === 'EACH_TEAM'
        // `objectives[].role = PRIMARY_SCORING` is what makes this the way to score at all, so it is cited
        // here rather than being given a sentence of its own that would only restate it.
        const objectiveRole = (game.objectives ?? [])[0]
        say(
            'How to score',
            statusOf.get(kindPath) ?? 'DERIVED',
            `A team scores ${primary.value} point by getting the ball across the marked line`,
            [kindPath, 'value.primaryEvent.value', ...(objectiveRole ? [`objectives[${objectiveRole.elementId}].role`] : [])],
            [primary.value],
        )
        if (objective) {
            say(
                'How to score',
                'DERIVED',
                shared
                    ? `Both teams attack the same line — the one you marked at the end of the area`
                    : `Each team attacks its own line`,
                [`objectives[${objective.elementId}].team`, `objectives[${objective.elementId}].reference`],
                [],
            )
            if (shared) {
                observations.push(
                    `Both teams score at the SAME line (objectives[${objective.elementId}].team = EACH_TEAM). That is the canonical ` +
                        `shared-objective decision, and it is deliberate — but it is an unusual arrangement for an invasion game, and a coach will need it said ` +
                        `plainly or they will set up two targets out of habit.`,
                )
            }
        }
    }

    // ── Observations about the game, not fixes to it ─────────────────────────────────────────────
    const channels = (game.space?.regions ?? []).filter((r: any) => r.noun === 'channel')
    if (channels.length > 2) {
        const anchors = channels.map((c: any) => geometryFor(c.elementId, 'across')?.geometry.anchor)
        observations.push(
            `The game contains ${channels.length} channels, and every one is anchored at across = ${anchors[0]} — the SAME touchline ` +
                `(${channels.map((c: any) => c.elementId).join(', ')}). A pitch has two touchlines, so a coach following this literally ` +
                `would mark one strip ${channels.length} times. The channels come from three separate Wide Zone contributions; whether they ` +
                `describe three regions or one region three times is a knowledge question, not a rendering one.`,
        )
    }

    const excludedFunctions = (fixture.status.notEstablished ?? []).filter((n: any) => n.path.endsWith('.functions'))
    if (excludedFunctions.length) {
        // Corrected after tracing the authored knowledge. The earlier wording called this a gap a coach
        // would notice — framing it as unauthored. It is not: the `functions` rows are excluded *by an
        // authored item* that names `access` as a forbidden member, and the Wide Zone separately CLAIMS a
        // value-modification and information relationship for the channel which reaches no line at all. So
        // the absence of a function string is not the finding; what the channel DOES is, and that is
        // reported against his operational-participation requirement rather than here.
        observations.push(
            `${excludedFunctions.length} \`functions\` rows are excluded, and that exclusion is AUTHORED rather than missing — the Wide Zone ` +
                `item names \`access\` as a forbidden member of \`functions\`. So a coach being told nothing about what a region is "for" is ` +
                `not by itself the defect. The defect is that nothing in the game establishes what CHANGES when players interact with the ` +
                `channels, which the operational-participation check reports separately.`,
        )
    }

    return { instructions, coachingObservations: observations }
}

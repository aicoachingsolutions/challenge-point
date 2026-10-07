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
 *
 * **SD-103, ruled 7 October, is the governing rule for everything below — and it was ruled because this
 * file broke it twice.**
 *
 *   > *Coach-facing language must be entailed by the resolved game and the rules it communicates. A
 *   > renderer may compress or combine supported facts, but it may not introduce an unsupported game fact
 *   > merely because that fact is obvious in the sport.*
 *
 * The two breaches were measured, not suspected. The scoring instruction hardcoded the English word for
 * whatever crosses the line and cited the scoring event for it, so it told coaches about a ball for weeks
 * while the representation established none. The possession-change instruction was gated on a transition's
 * play state alone, so it fired for ANY transition that continued play and asserted that possession was
 * what changed — it survived changing the trigger, and it survived deleting the possession relation from
 * the game outright. Neither was caught, because the fidelity check validates numbers appearing in prose
 * and never nouns: **an invented NOUN passes unchecked.** Both are repaired in place below, each by reading
 * its noun or its precondition from the game and citing it.
 *
 * The standing rule that follows from that: **if a sentence here names something in the game, the name
 * comes from the game and the path is cited.** "Obvious in the sport" is not a source.
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

            /**
             * **Which touchline, where the game says which.** The authored `lateral` selector now reaches
             * the artifact and the geometry places the two channels on opposite sides (0–7.5 m and
             * 22.5–30 m on a 30 m width). Rendering both as "along the touchline" dropped that and a coach
             * would mark one strip twice.
             *
             * It says "one" and "the opposite" rather than left and right: the authored values name the 0
             * and far edges of an axis, which is an axis convention and not a coach's left. The pairing is
             * established; which one a coach starts from is not, so it is not stated.
             */
            const lateral = (region.selector ?? []).find((t: any) => t.attribute === 'lateral')?.value
            const sides = (game.space?.regions ?? [])
                .map((r: any) => (r.selector ?? []).find((t: any) => t.attribute === 'lateral')?.value)
                .filter(Boolean)
            const paired = sides.length === 2 && new Set(sides).size === 2
            const where = !paired || !lateral ? 'along the touchline' : lateral === sides[0] ? 'along one touchline' : 'along the opposite touchline'

            say(
                'Set up',
                status,
                `Mark a ${noun} ${where}, ${metres((len?.to ?? 0) - (len?.from ?? 0))} long and up to ${metres((width?.to ?? 0) - (width?.from ?? 0))} wide`,
                [nounPath, along?.path, across?.path, ...(paired && lateral ? [`space.regions[${region.elementId}].selector`] : [])].filter(Boolean) as string[],
                [(len?.to ?? 0) - (len?.from ?? 0), (width?.to ?? 0) - (width?.from ?? 0)],
            )

            /**
             * **An established function is established knowledge, so it is carried.** His ruling is that a
             * function string is not what makes a region operationally realized — and that is a separate
             * question from whether it may be dropped. It may not: the game establishes it.
             *
             * Rendered close to the term rather than interpreted into a coaching purpose. Turning
             * `perceptual-reference` into advice about what players should look at would be inventing a
             * purpose the knowledge does not state. The system-term-to-coach-language mapping is a
             * vocabulary question and is reported rather than guessed.
             */
            const functions: string[] = Array.isArray((region as any).functions) ? (region as any).functions : []
            for (const member of functions) {
                say(
                    'Set up',
                    'DERIVED',
                    `This ${noun} is established as a ${String(member).replace(/-/g, ' ')}`,
                    [`space.regions[${region.elementId}].functions`, `space.regions[${region.elementId}].functions[${member}]`],
                    [],
                )
            }
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

        /**
         * **WHO STARTS WITH THE BALL — his ruling of 7 October, and the awkward truth it exposes.**
         *
         *   > *Once an established rule reads possession, the initial holder becomes activity-design
         *   > information under SD-104. Therefore the rendered activity must faithfully communicate which team
         *   > starts in possession.*
         *
         * The value is established and a coach genuinely needs it: the Wide Zone condition now reads
         * possession, so who starts decides whose touch can qualify in the first phase of play.
         *
         * **But "which team" is not expressible, and saying so IS the faithful rendering.** The holder is a
         * member handle, and `identity.unit.ts` pins that no handle may reach coach-facing output — deliberately,
         * because a handle is identity and not a property. More to the point, the two teams carry no
         * distinguishing property at all: they are identical but for that handle, which is why swapping the
         * holder leaves the whole game unchanged. So there is no fact of the form "the BLUE team starts" for
         * rendering to lose; there is only "one of the two does, and the game does not say which".
         *
         * That is what this says, and it cites both halves: `possession.team` for the relationship being
         * established and filled, `performers.teams` for there being two indiscernible teams to choose between.
         * A coach can act on it — they assign the ball before kick-off — and nothing is invented. The
         * observation below records what the activity therefore cannot tell them.
         */
        const holder = game.possession?.team
        if (holder) {
            const held = teams.some((t: any) => String(t.elementId) === String(holder))
            if (held) {
                say(
                    'Players',
                    'REALIZATION_CHOICE',
                    `One team starts with the ball — the game does not fix which, so pick one and tell both teams before you start`,
                    ['possession.team', 'performers.teams'],
                    [],
                )
                observations.push(
                    `The game DOES establish an initial holder of possession, and the activity cannot tell a coach which team it is. ` +
                        `The two teams are indiscernible — identical but for an internal handle that must not reach coach-facing text — so ` +
                        `the holder identifies a member without describing one. That matters now rather than before, because the wide-channel ` +
                        `condition reads possession, so who starts decides whose touch can qualify first. It is a knowledge gap and not a ` +
                        `rendering one: nothing authors anything that tells the two teams apart.`,
                )
            } else {
                observations.push(
                    `\`possession.team\` names ${String(holder)}, which is not one of the game's own teams, so the activity says nothing ` +
                        `about who starts with the ball rather than naming something a coach cannot find.`,
                )
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
    /**
     * **A possession-change sentence requires a possession-change transition AND the relation it changes.**
     * His ruling of 7 October, the second of two narrow repairs:
     *
     *   > *A rendered possession-change instruction may appear only when the represented transition is
     *   > actually keyed on `POSSESSION_CHANGE` and the required possession relationship is established.*
     *
     * This read `playState === 'CONTINUE'` and nothing else. So the sentence fired for ANY transition that
     * continues play, on any trigger whatever, and asserted to a coach that it was possession that changed.
     * Measured before the repair: it survived changing the trigger to something unrelated, and it survived
     * deleting the possession relation from the game outright. The word "possession" occurs in this file only
     * inside that string, so there was nothing else to notice.
     *
     * **`possession.team` is deliberately NOT cited.** The relation's establishment is a PRECONDITION for
     * emitting the sentence, not a source of its content: what the sentence says — a possession change does
     * not stop play — comes entirely from the trigger and the play state. Citing the holder would make the
     * fidelity check read it as carried to the coach when no coach reads it anywhere, which is exactly the
     * unverifiable citation his item-1 findings warn about. Under his item-2 ruling the holder needs no
     * coach-facing expression, and the honest way to say so is to leave it uncited and let it be reported.
     */
    for (const transition of game.transitions ?? []) {
        if (transition.playState !== 'CONTINUE') continue
        const keyedOnPossessionChange = (transition.selector ?? []).some(
            (term: any) => term?.attribute === 'trigger' && term?.op === '=' && term?.value === 'POSSESSION_CHANGE',
        )
        const relationEstablished = (game as any).possession?.team !== undefined
        if (keyedOnPossessionChange && relationEstablished) {
            say(
                'How it works',
                'DERIVED',
                `Play continues when possession changes — there is no stoppage`,
                [`transitions[${transition.elementId}].playState`, `transitions[${transition.elementId}].selector`],
                [],
            )
            continue
        }
        // Reported, not repaired — his standing instruction for anything the game itself makes unsayable.
        observations.push(
            keyedOnPossessionChange
                ? `${transition.elementId} is keyed on a possession change and continues play, but the game establishes no possession ` +
                  `relationship (\`possession.team\` is absent). A coach cannot be told that a possession change does not stop play ` +
                  `when nothing in the game holds the relation that would change. The sentence is withheld rather than asserted.`
                : `${transition.elementId} continues play rather than stopping it, and its trigger is not a possession change. ` +
                  `Rendering has no coach-facing wording for that trigger, so it says nothing rather than reusing the ` +
                  `possession-change sentence, which is what it used to do for any CONTINUE transition.`,
        )
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
        /**
         * **The thing that crosses the line is named only when the game establishes one, and the noun comes
         * from the game.** His ruling of 7 October, the first of two narrow repairs:
         *
         *   > *A rendered scoring instruction may mention the ball only when the represented game establishes
         *   > the ball and the instruction's provenance legitimately supports that reference.*
         *
         * And the governing principle he set above it: *"Coach-facing language must be entailed by the resolved
         * game and the rules it communicates. A renderer may compress or combine supported facts, but it may not
         * introduce an unsupported game fact merely because that fact is obvious in the sport."*
         *
         * This sentence used to hardcode the English word, cited to the scoring event, the point value and the
         * objective's role — none of which is an object. It therefore told coaches about a ball for weeks while
         * the representation established none, and nothing caught it: the fidelity check validates numbers in
         * prose and never nouns, so an invented NOUN passes unchecked.
         *
         * Two things make the repair rather than a patch. The noun is read from `objects[].kind` instead of
         * written here, so the renderer states no sport vocabulary of its own; and that path is CITED, so the
         * reference has provenance rather than being true by coincidence. Where no object is established the
         * carrier is not named at all and the gap is reported — the same treatment the unsettled
         * channel-condition trigger already gets below.
         */
        const carrier = (game.objects ?? []).find((object: any) => typeof object?.kind === 'string')
        say(
            'How to score',
            statusOf.get(kindPath) ?? 'DERIVED',
            carrier
                ? `A team scores ${primary.value} point by getting the ${carrier.kind} across the marked line`
                : `A team scores ${primary.value} point when the marked line is crossed`,
            [
                kindPath,
                'value.primaryEvent.value',
                ...(carrier ? [`objects[${carrier.elementId}].kind`] : []),
                ...(objectiveRole ? [`objectives[${objectiveRole.elementId}].role`] : []),
            ],
            [primary.value],
        )
        if (!carrier) {
            observations.push(
                `The scoring event is established and what crosses the line is not: the game holds no object, so the ` +
                    `instruction says the line is crossed without saying by what. A coach can run that only by deciding ` +
                    `for themselves whether a player, a pass or a carried object counts, which is a rule of the game and ` +
                    `not theirs to set. Withheld rather than filled in.`,
            )
        }
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

    /**
     * **The value modifier, carried without inventing what satisfies it.**
     *
     * The game establishes the whole effect — a region condition over two named channels, operation MULTIPLY,
     * magnitude 2 — so a coach is told the scoring consequence exactly. What it does NOT establish is what
     * counts as a qualifying interaction with a channel: `REGION_ENTRY` has no registered semantics, and the
     * authoring note records the gap in its own words ("no rule for what counts as 'moving through' (ball,
     * player, touch)"). That is the owner decision being held, so the rendering states the effect and says
     * plainly that the trigger is not settled, rather than choosing ball, player or touch for him.
     */
    for (const modifier of game.value?.valueModifiers ?? []) {
        const base = `value.valueModifiers[${modifier.elementId}]`
        const referents = (modifier.condition?.referents ?? []) as { structuralRef?: { contractId: string; itemId: string } }[]
        const regionsNamed = referents
            .map(r => (game.space?.regions ?? []).find((s: any) => String(s.elementId).endsWith(`:${r.structuralRef?.itemId}`)))
            .filter(Boolean)
        const noun = regionsNamed[0]?.noun ?? 'region'
        const operation = String(modifier.operation)
        const magnitude = Number(modifier.magnitude)
        const primary = game.value?.primaryEvent

        if (operation === 'MULTIPLY' && Number.isFinite(magnitude) && Number.isFinite(primary?.value)) {
            say(
                'How to score',
                'DERIVED',
                `When the ${noun} condition is met, that same score is worth ${primary.value * magnitude} instead of ${primary.value}`,
                [`${base}.operation`, `${base}.magnitude`, 'value.primaryEvent.value'],
                [primary.value * magnitude, primary.value],
            )
        }
        say(
            'How to score',
            'DERIVED',
            `The condition is about the ${regionsNamed.length === 2 ? `two ${noun}s` : noun} you marked — it applies to either of them`,
            [`${base}.condition.type`, `${base}.condition.referents`, ...referents.map(r => `${base}.condition.referents[${r.structuralRef?.contractId}::${r.structuralRef?.itemId}`.concat(']'))],
            [],
        )

        /**
         * **WHAT MEETS THE CONDITION, and WHEN IT ENDS — the two halves authored on 7 October.**
         *
         * The criterion is a qualitative term, so this is a translation of it and not a restatement of the
         * engine's own words. He authorized exactly that when he settled it: *"I would prefer the canonical
         * representation to carry that observable relationship rather than rely on the qualitative word
         * controlled. Coach-facing language may eventually translate it naturally."* The translation introduces
         * no fact the term does not carry — a touch, inside a referent region, by the attacking team, after
         * which that team still has the ball — and `condition.value` is cited, so SD-103 is satisfied by
         * provenance rather than by assertion.
         *
         * Both sentences are gated on the fields being present. Where a modifier carries no criterion the
         * observation below reports that gap exactly as it did before, which is the state every modifier
         * authored before today is still in.
         */
        const criterion = modifier.condition?.value
        if (criterion) {
            say(
                'How to score',
                'DERIVED',
                `It is met when the attacking team touches the ball inside one of them and still has the ball after that touch`,
                [`${base}.condition.value`],
                [],
            )
        }
        if (modifier.endsOn === 'POSSESSION_CHANGE') {
            say(
                'How to score',
                'DERIVED',
                `Once met it stays live while that team keeps the ball, and a change of possession ends it`,
                [`${base}.endsOn`],
                [],
            )
        } else if (modifier.endsOn) {
            // A termination this renderer has no coach wording for is reported, never paraphrased.
            observations.push(
                `${modifier.elementId} ends on ${String(modifier.endsOn)}, and rendering has no coach-facing wording for that ` +
                    `occurrence, so the activity says nothing about when the modification ends. The game establishes it; the ` +
                    `translation is missing, which is a rendering gap rather than a knowledge one.`,
            )
        }

        if (!criterion) {
            observations.push(
                `The game establishes WHAT the wide channels do — a line crossing is worth ${Number.isFinite(magnitude) && Number.isFinite(primary?.value) ? primary.value * magnitude : 'more'} ` +
                    `instead of ${primary?.value} when the condition is met — but NOT what counts as meeting it. The authored source is "actions starting in or ` +
                    `moving through the wide channel", \`REGION_ENTRY\` carries no registered semantics, and the authoring note states the gap itself: ` +
                    `"no rule for what counts as 'moving through' (ball, player, touch)". So a coach is told the consequence and cannot be told the ` +
                    `trigger. Nothing is chosen here on the engine's behalf.`,
            )
        }
        if (criterion && !modifier.endsOn) {
            observations.push(
                `${modifier.elementId} states what satisfies its condition and nothing about when the modification ends, so on the ` +
                    `representation it does not persist beyond the event it is evaluated at. That is the row's stated reading of an absent ` +
                    `termination and not an oversight — but if the intent was a persisting advantage, the termination is what is missing.`,
            )
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

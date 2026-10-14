/**
 * The session boundary — where a coach's own session becomes the envelope the pathway derives in.
 *
 * Christian, 13 October 2026: *"The review page should accept any of the thirteen Learning Goals and use the
 * coach's actual session context. [The specialized role's] availability should come from the Team Profile
 * or session configuration, with the coach able to confirm or adjust it. The system should not silently
 * assume that no [such players] are available."* (He named the role. It is bracketed out here only because
 * this module sits above the sport layer and the coupling ratchet correctly refuses to let a role be named
 * in it: which roles are specialized is the register's to say, and this module asks it.)
 *
 * **IT DEFAULTS NOTHING.** That is the rule the whole module exists to keep, and each half of it was
 * measured as a defect before this existed:
 *
 *   - the pilot inherited its specialized-role availability from a module constant that states zero for
 *     every role — right for the run it was written for, by his ruling of 1 October *"a session fact for this
 *     run, not a default assumption"*, and an assumption the moment a second session used it;
 *   - the stored area arrives as strings, and the pathway threw on them (`n.toFixed is not a function`),
 *     which a route would have served as a 500;
 *   - zero players was SERVED (*"0 players in total / 2 teams of 0"*), a one-metre square was served, a
 *     width longer than the length was refused three stages later for a reason about a region's placement,
 *     and a role name the register does not hold was silently summed into the roster.
 *
 * So everything the envelope needs is either stated — by the stored session, or by the coach for this
 * review — or it is named as missing in a sentence a coach can act on. Nothing is coerced into range,
 * nothing is swapped, and no absent fact becomes a number.
 *
 * **Two sources, and the second only confirms or adjusts.** `stored` is the session as saved. `stated` is
 * what this review's request supplies: the duration, which a session does not have (it belongs to an
 * activity), and the coach's statement of specialized-role availability, which overrides the stored value
 * for this review and changes nothing that is stored.
 *
 * It is pure: no database, no request object. The route hands it a plain session and a plain body.
 */
import { parseSessionArea } from '../activity/playing-area'
import { loadRegister } from '../derivation/corpus'
import { indexRegister } from '../derivation/register'

export interface ActivitySession {
    players: number
    lengthM: number
    widthM: number
    durationMin: number
    /** Specialized-role AVAILABILITY in the session, role name -> number of people. Absent = not stated. */
    roles: Record<string, number>
}

/** The part of a stored session this boundary reads. Typed loosely because it is checked here, not trusted. */
export interface StoredSession {
    playerCount?: unknown
    fieldLength?: unknown
    fieldWidth?: unknown
    specializedRoles?: unknown
}

/** What the review's own request states. */
export interface StatedForReview {
    durationMin?: unknown
    roles?: unknown
}

export type SessionEnvelope =
    | { outcome: 'stated'; session: ActivitySession }
    /** `summary` is the first thing missing, as one sentence; `reasons` is every one of them. */
    | { outcome: 'not-stated'; summary: string; reasons: string[] }

/** The specialized roles the register names. The only place a role's name comes from. */
export function specializedRoleNames(): string[] {
    return [...new Set(indexRegister(loadRegister()).specializedRoleRows.values())]
}

/**
 * The sentence asking for a role's availability, built from the role's name as the register gives it.
 * Exported because the roster rule can reach the same gap from the other side, and a coach should be asked
 * the same question in the same words whichever one noticed.
 */
export const availabilityQuestion = (role: string): string => `Say whether this session has ${role}s before building an activity.`

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const absent = (value: unknown): boolean => value === undefined || value === null || value === ''

export function sessionEnvelopeFrom(stored: StoredSession, stated: StatedForReview, specializedRoles: string[] = specializedRoleNames()): SessionEnvelope {
    const missing: string[] = []

    // ── Players: a whole number of people, at least one ─────────────────────────────────────────────
    const players = stored.playerCount
    if (absent(players)) missing.push('This session has no player count yet — add the number of players.')
    else if (typeof players !== 'number' || !Number.isInteger(players) || players < 1) {
        missing.push('The number of players in this session must be a whole number, 1 or more.')
    }

    // ── Area: stored as bare numeric strings, in metres ──────────────────────────────────────────────
    const area = parseSessionArea(
        absent(stored.fieldLength) ? undefined : String(stored.fieldLength),
        absent(stored.fieldWidth) ? undefined : String(stored.fieldWidth),
    )
    if (absent(stored.fieldLength) && absent(stored.fieldWidth)) {
        missing.push('This session has no playing area yet — add its length and width.')
    } else if (!area) {
        missing.push('The playing area needs both a length and a width, in metres and more than zero.')
    } else if (area.widthMetres > area.lengthMetres) {
        /**
         * **Said, not swapped.** Placement takes the longer side as the direction of play while the checks
         * compare against the length as entered, so a 25 by 30 session was refused downstream for a
         * region lying outside the area. Exchanging the two here would have made it pass — and would have
         * built the coach a different pitch from the one they described without telling them.
         */
        missing.push(
            `This session's playing area is entered as ${area.lengthMetres} m long by ${area.widthMetres} m wide — the length needs to be the longer side.`,
        )
    }

    // ── Duration: stated for this review, because a session has none ─────────────────────────────────
    const duration = stated.durationMin
    if (absent(duration)) missing.push('Say how long this activity should run, in minutes.')
    else if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
        missing.push('The length of the activity must be a number of minutes, more than zero.')
    }

    /**
     * ── Specialized-role availability: stated, never assumed ───────────────────────────────────────
     *
     * The stored statement, with this review's laid over it role by role. A role nobody has stated is
     * asked for by name; the name is the register's, so a sport with a different specialized role, or
     * with two, is asked about those instead and nothing here changes.
     *
     * A name the register does not hold is refused rather than carried. Carried, it would be a count of
     * people with no row to be involved through, and the session would be claiming a kind of player the
     * engine cannot place.
     */
    // Laid over one another FIRST and judged afterwards, so a usable statement for this review is not
    // refused on account of a stored one it replaces.
    //
    // **Held in a Map, and every NAME is kept whether or not it came with a count.** Both were found in
    // review on 13 October. As a plain object this was keyed by text from a request body, so a role named
    // `__proto__` was assigned to the object's prototype and vanished — served, where every other unknown
    // name is refused — and `in` answered for inherited keys, so a role the register spelled like one of
    // them would never have been asked about. And a name with no count beside it was dropped before its
    // name was looked at, so an unknown kind of player was refused with a number and accepted without one.
    // A name is validated because it was NAMED; `undefined` here means "named, and no count stated".
    const merged = new Map<string, unknown>()
    for (const [source, value] of [['stored', stored.specializedRoles], ['stated', stated.roles]] as const) {
        if (absent(value)) continue
        if (!isRecord(value)) {
            missing.push(`The ${source === 'stored' ? "session's" : "review's"} list of specialized players could not be read.`)
            continue
        }
        for (const [role, count] of Object.entries(value)) {
            if (!absent(count)) merged.set(role, count)
            else if (!merged.has(role)) merged.set(role, undefined)
        }
    }
    const roles: Record<string, number> = {}
    for (const [role, count] of merged) {
        if (!specializedRoles.includes(role)) {
            missing.push(`This session names a kind of player the activity engine does not know: ${role}.`)
            continue
        }
        if (count === undefined) continue // named and not counted: asked for below, like one never named
        if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
            missing.push(`The number of ${role}s must be a whole number, 0 or more.`)
            continue
        }
        // Availability counts people who are IN the session, so it cannot exceed the session. Unchecked, it
        // would pass everything downstream: a game that involves none of a role never compares the two.
        if (typeof players === 'number' && Number.isInteger(players) && players >= 1 && count > players) {
            missing.push(`This session lists more ${role}s than it has players.`)
            continue
        }
        roles[role] = count
    }
    for (const role of specializedRoles) {
        if (merged.get(role) === undefined) missing.push(availabilityQuestion(role))
    }

    if (missing.length) return { outcome: 'not-stated', summary: missing[0], reasons: missing }
    return {
        outcome: 'stated',
        session: {
            players: players as number,
            lengthM: area!.lengthMetres,
            widthM: area!.widthMetres,
            durationMin: duration as number,
            roles,
        },
    }
}

import { IActivity } from '@/MODELS/activity.model'

/**
 * THE ACTIVITY, AS A COACH READS IT. Six sections, each answering exactly one question — Christian's
 * design rule, 2026-09-11:
 *
 *   Objective      What are we working on today?
 *   Setup          How do I organize it?
 *   Rules          What do players have to do?
 *   Scoring        How do teams score?
 *   Win Condition  When does it end and who wins?
 *   Equipment      What do I need?
 *
 * "Whenever a section begins answering another section's question, confusion seems to follow."
 *
 * There is no seventh section and no optional expansion. Everything removed was removed because it
 * answered a question another section already owns:
 *   - Constraint      — answered none of them. Still stored: the validator checks it.
 *   - Coaching Focus  — redundant with the Learning Goal and the Objective.
 *   - How to Play     — "what do players have to do?" is Rules'. Folded in server-side; activities
 *                       generated before that change still carry the field, so it is folded in here.
 *   - Teams           — "how do I organize it?" is Setup's, and Setup already states the format.
 *                       (Stored as `extensions[0]`, which is why the inventory called it Extensions.)
 *   - Group size      — Setup's question too.
 *
 * ONE COMPONENT FOR EVERY SURFACE. The generator's cards and the activity page each had their own
 * copy of this list, in slightly different orders, and the generator's expanded card repeated the
 * Objective and Setup it had just shown above. One definition means one order, and the six sections
 * cannot drift apart again surface by surface.
 */
export default function ActivitySections({ activity, compact = false }: { activity: IActivity; compact?: boolean }) {
    const body = compact ? 'text-sm leading-relaxed text-gray-700' : 'leading-relaxed text-gray-700'
    const label = 'text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'

    // Activities generated before How to Play was merged server-side still have it as its own list.
    // Folded in first, in the same position the server now puts it, so old and new read the same.
    const legacyHowToPlay = ((activity as unknown as { howToPlay?: string[] }).howToPlay ?? []).filter(Boolean)
    const rules = [...legacyHowToPlay.filter((line) => !(activity.rules ?? []).includes(line)), ...(activity.rules ?? [])]

    const equipment = (activity.equipmentNeeded ?? []).filter(Boolean)

    return (
        <div className={compact ? 'space-y-4' : 'space-y-5'}>
            {activity.intent && (
                <div>
                    <p className={label}>Objective</p>
                    <p className={body}>{activity.intent}</p>
                </div>
            )}

            {activity.setup && (
                <div className={`${compact ? 'p-3' : 'p-4'} rounded-lg bg-blue-50 border border-blue-200`}>
                    <p className='text-xs font-semibold uppercase tracking-wide text-blue-700 mb-1'>Setup</p>
                    <p className='text-sm leading-relaxed text-blue-900 whitespace-pre-line'>{activity.setup}</p>
                </div>
            )}

            {rules.length > 0 && (
                <div>
                    <p className={`${label} mb-2`}>Rules</p>
                    <ol className='space-y-2'>
                        {rules.map((rule, i) => (
                            <li key={i} className='flex gap-3 text-sm text-gray-700'>
                                <span className='flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold mt-0.5'>
                                    {i + 1}
                                </span>
                                <span className='leading-relaxed'>{rule}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {activity.scoringSystem && (
                <div className={`${compact ? 'px-3 py-2' : 'p-4'} rounded-lg bg-amber-50 border border-amber-200`}>
                    <p className='text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1'>Scoring</p>
                    <p className='text-sm leading-relaxed text-amber-800'>{activity.scoringSystem}</p>
                </div>
            )}

            {activity.winCondition && (
                <div>
                    <p className={label}>Win Condition</p>
                    <p className='text-sm leading-relaxed text-gray-700'>{activity.winCondition}</p>
                </div>
            )}

            {equipment.length > 0 && (
                <div>
                    <p className={label}>Equipment</p>
                    <ul className='space-y-1'>
                        {equipment.map((item, i) => (
                            <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                                <span aria-hidden className='text-gray-400'>
                                    &bull;
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

        </div>
    )
}

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { IActivity } from '@/MODELS/activity.model'

/**
 * THE ACTIVITY, AS A COACH READS IT — Christian's decision, 2026-09-10.
 *
 *   Objective · Setup · Rules · Scoring · Win Condition · Equipment
 *
 * and nothing else on the first read. His reasoning: a coach should understand and organize the
 * activity after one read, and "if a coach wouldn't naturally say it before starting an activity, the
 * activity probably shouldn't say it either."
 *
 * What changed, and where each thing went:
 *   - Constraint      — removed from every coach screen. Still stored: the validator checks it.
 *   - Coaching Focus  — removed; he judged it redundant with the Learning Goal and the Objective.
 *   - How to Play     — folded into Rules on the server. Activities generated before that change
 *                       still carry the field, so it is folded in here too, rather than dropped.
 *   - Teams           — optional, behind "More detail". (Stored as `extensions[0]`, which is why the
 *                       section list he reviewed called it Extensions. It holds the team structure.)
 *   - Group size      — optional; Setup already states the format.
 *
 * ONE COMPONENT FOR EVERY SURFACE. The generator's cards and the activity page each had their own
 * copy of this list, in slightly different orders, and the generator's expanded card repeated the
 * Objective and Setup it had just shown above. One definition means one order, and the six sections
 * cannot drift apart again surface by surface.
 */
export default function ActivitySections({ activity, compact = false }: { activity: IActivity; compact?: boolean }) {
    const [showMore, setShowMore] = useState(false)

    const body = compact ? 'text-sm leading-relaxed text-gray-700' : 'leading-relaxed text-gray-700'
    const label = 'text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'

    // Activities generated before How to Play was merged server-side still have it as its own list.
    // Folded in first, in the same position the server now puts it, so old and new read the same.
    const legacyHowToPlay = ((activity as unknown as { howToPlay?: string[] }).howToPlay ?? []).filter(Boolean)
    const rules = [...legacyHowToPlay.filter((line) => !(activity.rules ?? []).includes(line)), ...(activity.rules ?? [])]

    const equipment = (activity.equipmentNeeded ?? []).filter(Boolean)
    const teams = activity.extensions?.[0]
    const learningGoals = activity.learningPriorities?.map((goal) => goal.description).filter(Boolean) ?? []
    const hasMoreDetail = Boolean(teams) || Boolean(activity.playerGroupSizes) || learningGoals.length > 0

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

            {/* Optional, and collapsed by default: useful, but not part of the first read. */}
            {hasMoreDetail && (
                <div className='pt-1'>
                    <button
                        type='button'
                        onClick={() => setShowMore((current) => !current)}
                        className='inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900'
                    >
                        {showMore ? <ChevronUpIcon className='w-4 h-4' /> : <ChevronDownIcon className='w-4 h-4' />}
                        {showMore ? 'Less detail' : 'More detail'}
                    </button>

                    {showMore && (
                        <div className='mt-3 space-y-4'>
                            {teams && (
                                <div>
                                    <p className={label}>Teams</p>
                                    <p className='text-sm leading-relaxed text-gray-700'>{teams}</p>
                                </div>
                            )}
                            {Boolean(activity.playerGroupSizes) && (
                                <div>
                                    <p className={label}>Group size</p>
                                    <p className='text-sm text-gray-700'>{activity.playerGroupSizes} players</p>
                                </div>
                            )}
                            {learningGoals.length > 0 && (
                                <div>
                                    <p className={label}>Learning goals</p>
                                    <ul className='space-y-1'>
                                        {learningGoals.map((goal, i) => (
                                            <li key={i} className='text-sm text-gray-700'>
                                                {goal}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

import { useState } from 'react'

import { api } from '@/services/api.service'

/**
 * The review-moment question — Christian's pilot request (16 Aug).
 *
 * WHY IT IS SEPARATE FROM ActivityFeedback. That widget asks "was this activity useful?", which only
 * a coach who actually ran the session can answer. This one is answerable the moment the activity is
 * read, which means it also captures the coach who looks at what we generated, decides they would not
 * put it in front of players, and closes the tab. That coach is currently invisible, and they are the
 * most important coach in the pilot.
 *
 * DESIGN RULES, all of them chosen to protect the cheap signal:
 *   - One tap completes it. The follow-up text is optional and appears only after the tap, so a
 *     coach who answers and leaves has still given us the answer that matters.
 *   - "With changes" exists because it is the honest middle. Forcing yes/no would push every partial
 *     into whichever end the coach felt worse about, and we would not know which.
 *   - Nothing is attached by the coach. The activity id carries the learning goal, practice
 *     situation, learning stage and the full generation trace on the server side already.
 *   - It never blocks and never shows an error. Evidence collection must not become one more thing
 *     that failed in front of a coach on their first evening with the app.
 */
export default function ActivityReviewPrompt({ activityId, sessionId }: { activityId?: string; sessionId?: string }) {
    const [answer, setAnswer] = useState<'yes' | 'with_changes' | 'no' | null>(null)
    const [whatWouldChange, setWhatWouldChange] = useState('')
    const [unclear, setUnclear] = useState('')
    const [detailSent, setDetailSent] = useState(false)

    const send = (payload: Record<string, unknown>) => {
        void api('app/activity-review', { activityId, sessionId, ...payload }).catch(() => undefined)
    }

    const choose = (value: 'yes' | 'with_changes' | 'no') => {
        setAnswer(value)
        // Recorded immediately. If the coach never fills in the text, we still have the answer.
        send({ answer: value })
    }

    const sendDetail = () => {
        if (!answer) return
        send({ answer, whatWouldChange: whatWouldChange.trim() || undefined, unclear: unclear.trim() || undefined })
        setDetailSent(true)
    }

    const OPTIONS = [
        { value: 'yes', label: 'Yes' },
        { value: 'with_changes', label: 'With changes' },
        { value: 'no', label: 'No' },
    ] as const

    return (
        <div className='order-5 px-4 py-3 bg-white border rounded-lg shadow-sm'>
            <p className='text-sm font-medium text-gray-700'>Would you run this activity as written?</p>

            <div className='flex flex-wrap gap-2 mt-2'>
                {OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type='button'
                        aria-pressed={answer === option.value}
                        onClick={() => choose(option.value)}
                        className={`px-4 py-1.5 text-sm border rounded-full transition-colors ${
                            answer === option.value
                                ? 'bg-brand-50 border-brand-400 text-brand-800'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {answer && !detailSent && (
                <div className='mt-3 space-y-2'>
                    {/* Only asked when there is something to explain — a coach who said yes is not
                        interrogated about why. */}
                    {answer !== 'yes' && (
                        <input
                            type='text'
                            value={whatWouldChange}
                            onChange={(e) => setWhatWouldChange(e.target.value)}
                            placeholder='What would you change? (optional)'
                            className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500'
                        />
                    )}
                    <input
                        type='text'
                        value={unclear}
                        onChange={(e) => setUnclear(e.target.value)}
                        placeholder='Anything confusing, unclear, or unrealistic? (optional)'
                        className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500'
                    />
                    <div className='flex items-center gap-3'>
                        <button
                            type='button'
                            onClick={sendDetail}
                            className='px-4 py-1.5 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700'
                        >
                            Send
                        </button>
                        <span className='text-xs text-gray-500'>Answer saved — the notes are optional.</span>
                    </div>
                </div>
            )}

            {detailSent && <p className='mt-3 text-sm text-gray-500'>Thank you — that goes straight to the next revision.</p>}
        </div>
    )
}

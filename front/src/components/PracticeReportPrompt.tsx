import { useState } from 'react'

import { api } from '@/services/api.service'

/**
 * THE TWO POST-PRACTICE QUESTIONS — Path to Pilot Checklist RC4, section 4.
 *
 * WHY THESE ARE SEPARATE FROM ActivityReviewPrompt. That one asks "would you run this as written?"
 * and is answerable the moment the activity is read. These two are only answerable by a coach who
 * took it to a field, which makes them a smaller sample and a more expensive one — so they are asked
 * once, at the review moment after the activity ends, and never repeated.
 *
 * WHY THE PAIRING IS THE MEASUREMENT. "Did you modify the activity?" is informative BECAUSE the same
 * coach was already asked, before practice, whether they would run it as written. Yes-then-modified
 * is the interesting cell: the activity read as usable and turned out not to be. That distinguishes
 * a communication problem from a design problem, and neither question shows it alone.
 *
 * WHY THE SECOND QUESTION EXISTS AT ALL. Degenerate solutions are the failure mode representative
 * design is most exposed to, and they are invisible from our side by construction — the activity
 * ran, points were scored, the telemetry looks healthy, and only the coach standing on the field saw
 * players satisfying the scoring condition without ever engaging the intended problem. The checklist
 * defers the Degenerate Solution Pattern Catalogue to post-pilot, which is exactly why the raw
 * reports have to be collected now: that catalogue cannot be built later out of evidence nobody
 * captured at the time.
 *
 * DESIGN RULES, inherited from ActivityReviewPrompt and for the same reasons:
 *   - Each answer is recorded the moment it is tapped. A coach who answers one question and walks
 *     away has still given us that answer.
 *   - The free text appears only after a "Yes", and is always optional.
 *   - Never blocks, never throws, never shows an error. A coach reporting what happened at practice
 *     must not be met with a failure from the thing asking.
 */
export default function PracticeReportPrompt({ activityId, sessionId }: { activityId?: string; sessionId?: string }) {
    const [didModify, setDidModify] = useState<'yes' | 'no' | null>(null)
    const [modificationDetail, setModificationDetail] = useState('')
    const [unexpectedSuccess, setUnexpectedSuccess] = useState<'yes' | 'no' | null>(null)
    const [unexpectedSuccessDetail, setUnexpectedSuccessDetail] = useState('')
    const [detailSent, setDetailSent] = useState(false)

    const send = (payload: Record<string, unknown>) => {
        void api('app/practice-report', { activityId, sessionId, ...payload }).catch(() => undefined)
    }

    const chooseModify = (value: 'yes' | 'no') => {
        setDidModify(value)
        send({ didModify: value, unexpectedSuccess: unexpectedSuccess ?? undefined })
    }

    const chooseUnexpected = (value: 'yes' | 'no') => {
        setUnexpectedSuccess(value)
        send({ didModify: didModify ?? undefined, unexpectedSuccess: value })
    }

    const sendDetail = () => {
        if (!didModify && !unexpectedSuccess) return
        send({
            didModify: didModify ?? undefined,
            modificationDetail: modificationDetail.trim() || undefined,
            unexpectedSuccess: unexpectedSuccess ?? undefined,
            unexpectedSuccessDetail: unexpectedSuccessDetail.trim() || undefined,
        })
        setDetailSent(true)
    }

    const YES_NO = [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
    ] as const

    const hasDetailToSend =
        (didModify === 'yes' || unexpectedSuccess === 'yes') && !detailSent

    const Choice = ({
        options,
        selected,
        onChoose,
    }: {
        options: ReadonlyArray<{ value: 'yes' | 'no'; label: string }>
        selected: 'yes' | 'no' | null
        onChoose: (value: 'yes' | 'no') => void
    }) => (
        <div className='flex flex-wrap gap-2'>
            {options.map((option) => (
                <button
                    key={option.value}
                    type='button'
                    aria-pressed={selected === option.value}
                    onClick={() => onChoose(option.value)}
                    className={`px-4 py-1.5 text-sm border rounded-full transition-colors ${
                        selected === option.value
                            ? 'bg-brand-50 border-brand-400 text-brand-800'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )

    return (
        <div className='px-4 py-3 space-y-4 bg-white border rounded-lg shadow-sm'>
            <p className='text-sm font-semibold text-gray-800'>After practice</p>

            <div>
                <p className='mb-2 text-sm font-medium text-gray-700'>Did you modify the activity?</p>
                <Choice options={YES_NO} selected={didModify} onChoose={chooseModify} />
                {didModify === 'yes' && !detailSent && (
                    <input
                        type='text'
                        value={modificationDetail}
                        onChange={(e) => setModificationDetail(e.target.value)}
                        placeholder='What changed? (optional)'
                        className='w-full mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500'
                    />
                )}
            </div>

            <div>
                <p className='mb-2 text-sm font-medium text-gray-700'>
                    Did your players discover an unexpected way to succeed?
                </p>
                <Choice options={YES_NO} selected={unexpectedSuccess} onChoose={chooseUnexpected} />
                {unexpectedSuccess === 'yes' && !detailSent && (
                    <input
                        type='text'
                        value={unexpectedSuccessDetail}
                        onChange={(e) => setUnexpectedSuccessDetail(e.target.value)}
                        placeholder='What happened? (optional)'
                        className='w-full mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500'
                    />
                )}
            </div>

            {hasDetailToSend && (
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={sendDetail}
                        className='px-4 py-1.5 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700'
                    >
                        Send
                    </button>
                    <span className='text-xs text-gray-500'>Answers saved — the notes are optional.</span>
                </div>
            )}

            {detailSent && <p className='text-sm text-gray-500'>Thank you — that is exactly what the pilot needs.</p>}
        </div>
    )
}

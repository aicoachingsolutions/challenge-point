import { useEffect, useState } from 'react'

import { api } from '@/services/api.service'
import { recordWouldUseAgain } from '@/services/coach-events.service'

/**
 * Post-use coach feedback — Runtime Interface RC1.2 §42 (Pilot 1 observation flow).
 *
 * Two layers, deliberately:
 *
 *   1. A thumb. One tap, and the interaction is complete — a coach who taps and walks away has
 *      still given us signal. This is sentiment, not evidence.
 *   2. The canonical observation vocabulary. Structured evidence a machine can aggregate, which is
 *      what Experience Intelligence will eventually be calibrated against.
 *
 * The second is optional on purpose. Coach Intelligence §24 says observation capture should
 * prioritise speed over completeness and avoid unnecessary typing — a required nine-option form
 * after every activity would be abandoned, and abandoned forms produce no evidence at all.
 *
 * The vocabulary is FETCHED, never hardcoded here. §50 lets coach-facing labels change while stored
 * codes stay fixed; keeping one copy on the server means a reworded label ships without a client
 * release, and a client can never offer a code the server would reject.
 */

interface VocabularyOption {
    code: string
    label: string
}
interface VocabularyGroup {
    heading: string
    options: VocabularyOption[]
}
interface StageOption {
    stage: string
    label: string
}
interface Vocabulary {
    groups: VocabularyGroup[]
    sessionStages: StageOption[]
}

export default function ActivityFeedback({ activityId, sessionId }: { activityId?: string; sessionId?: string }) {
    /** Null until answered — the question is asked once and then acknowledged, never re-prompted. */
    const [intentAnswer, setIntentAnswer] = useState<'yes' | 'no' | 'unsure' | null>(null)
    const [rating, setRating] = useState<'up' | 'down' | null>(null)
    const [comment, setComment] = useState('')
    const [sent, setSent] = useState(false)
    const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null)
    const [selectedCodes, setSelectedCodes] = useState<string[]>([])
    const [sessionStage, setSessionStage] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Loaded only once the coach engages — no cost for anyone who never opens the panel.
    useEffect(() => {
        if (!rating || vocabulary) return
        let cancelled = false
        // No body → the api helper issues a GET.
        void api<Vocabulary>('app/observation-vocabulary').then((res) => {
            if (!cancelled && res.data && Array.isArray(res.data.groups)) setVocabulary(res.data)
        })
        return () => {
            cancelled = true
        }
    }, [rating, vocabulary])

    const toggleCode = (code: string) =>
        setSelectedCodes((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]))

    const submit = async () => {
        setSaveError(null)
        try {
            await api('app/activity-feedback', { activityId, sessionId, rating, comment })
            // Observations are a separate runtime object with their own contract, so they post
            // separately — the thumb is sentiment, these are evidence.
            if (selectedCodes.length > 0) {
                const res = await api('app/observations', {
                    observationCodes: selectedCodes,
                    // Stage is required by the contract; default to the common post-use case rather
                    // than forcing a choice the coach may not care to make.
                    sessionStage: sessionStage ?? 'ESTABLISHED',
                    activityId,
                    sessionId,
                    coachNote: comment || undefined,
                })
                if (res.error) throw new Error(typeof res.error === 'string' ? res.error : 'Could not save your notes.')
            }
            setSent(true)
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Could not save that. Please try again.')
        }
    }

    if (sent) {
        return (
            <div className='order-6 px-4 py-3 bg-white border rounded-lg shadow-sm'>
                <p className='text-sm text-center text-gray-500'>Thanks — this is what shapes the next set of activities.</p>

                {/*
                  * THE PILOT'S MOST IMPORTANT QUESTION, and the only one no instrumentation can infer.
                  *
                  * Asked AFTER the coach has already given feedback, so it cannot deter the cheaper
                  * signal — a coach who answers the thumb and stops has still given us something. It
                  * appears here rather than in a separate survey because this is the moment the coach
                  * still remembers the session; asked later it measures memory instead of experience.
                  */}
                {intentAnswer === null ? (
                    <div className='pt-3 mt-3 border-t border-gray-100'>
                        <p className='mb-2 text-sm font-medium text-center text-gray-700'>
                            Would you use Challenge Point for your next practice?
                        </p>
                        <div className='flex justify-center gap-2'>
                            {(['yes', 'unsure', 'no'] as const).map((answer) => (
                                <button
                                    key={answer}
                                    type='button'
                                    onClick={() => {
                                        setIntentAnswer(answer)
                                        recordWouldUseAgain(answer)
                                    }}
                                    className='px-4 py-1.5 text-sm capitalize transition-colors border rounded-full border-gray-200 hover:bg-gray-50'
                                >
                                    {answer}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className='pt-3 mt-3 text-sm text-center text-gray-500 border-t border-gray-100'>
                        Noted — thank you.
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className='order-6 px-4 py-3 bg-white border rounded-lg shadow-sm'>
            <div className='flex items-center gap-3'>
                <span className='text-sm font-medium text-gray-700'>Was this activity useful?</span>
                <button
                    type='button'
                    aria-label='Thumbs up'
                    onClick={() => {
                        setRating('up')
                        void api('app/activity-feedback', { activityId, sessionId, rating: 'up' })
                    }}
                    className={`px-3 py-1.5 text-lg rounded-full border transition-colors ${
                        rating === 'up' ? 'bg-emerald-100 border-emerald-300' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    👍
                </button>
                <button
                    type='button'
                    aria-label='Thumbs down'
                    onClick={() => {
                        setRating('down')
                        void api('app/activity-feedback', { activityId, sessionId, rating: 'down' })
                    }}
                    className={`px-3 py-1.5 text-lg rounded-full border transition-colors ${
                        rating === 'down' ? 'bg-red-100 border-red-300' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    👎
                </button>
            </div>

            {rating && (
                <div className='mt-4 space-y-4'>
                    {vocabulary && (
                        <>
                            <div>
                                <p className='mb-1 text-sm font-medium text-gray-700'>Anything you noticed?</p>
                                <p className='mb-3 text-xs text-gray-500'>Optional — tap any that apply.</p>
                                <div className='space-y-3'>
                                    {vocabulary.groups.map((group) => (
                                        <div key={group.heading}>
                                            <p className='mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase'>
                                                {group.heading}
                                            </p>
                                            <div className='flex flex-wrap gap-2'>
                                                {group.options.map((option) => {
                                                    const selected = selectedCodes.includes(option.code)
                                                    return (
                                                        <button
                                                            key={option.code}
                                                            type='button'
                                                            aria-pressed={selected}
                                                            onClick={() => toggleCode(option.code)}
                                                            className={`px-3 py-1.5 text-sm text-left border rounded-full transition-colors ${
                                                                selected
                                                                    ? 'bg-brand-50 border-brand-400 text-brand-800'
                                                                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedCodes.length > 0 && (
                                <div>
                                    <p className='mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase'>
                                        When did you notice it?
                                    </p>
                                    <div className='flex flex-wrap gap-2'>
                                        {vocabulary.sessionStages.map((s) => (
                                            <button
                                                key={s.stage}
                                                type='button'
                                                aria-pressed={sessionStage === s.stage}
                                                onClick={() => setSessionStage(s.stage)}
                                                className={`px-3 py-1.5 text-sm border rounded-full transition-colors ${
                                                    sessionStage === s.stage
                                                        ? 'bg-brand-50 border-brand-400 text-brand-800'
                                                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className='flex items-center gap-2'>
                        <input
                            type='text'
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={rating === 'down' ? 'What would have made it better? (optional)' : 'Anything to add? (optional)'}
                            className='flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500'
                        />
                        <button
                            type='button'
                            onClick={submit}
                            className='px-4 py-1.5 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700'
                        >
                            Send
                        </button>
                    </div>

                    {saveError && <p className='text-sm text-amber-700'>{saveError}</p>}
                </div>
            )}
        </div>
    )
}

import { useState } from 'react'
import { api } from '@/services/api.service'

/**
 * MVP field-evidence widget: one-tap coach feedback on a generated activity, with an optional
 * comment. Posts to /api/app/activity-feedback (fire-and-forget usage event). Deliberately tiny —
 * the goal is signal volume, so the happy path is two clicks or less.
 */
export default function ActivityFeedback({ activityId, sessionId }: { activityId?: string; sessionId?: string }) {
    const [rating, setRating] = useState<'up' | 'down' | null>(null)
    const [comment, setComment] = useState('')
    const [sent, setSent] = useState(false)

    const send = async (r: 'up' | 'down', withComment?: string) => {
        setRating(r)
        await api('app/activity-feedback', { activityId, sessionId, rating: r, comment: withComment })
        if (withComment !== undefined) setSent(true)
    }

    if (sent) {
        return (
            <div className='order-6 px-4 py-3 text-sm text-center text-gray-500 bg-white border rounded-lg shadow-sm'>
                Thanks — your feedback helps improve the activities.
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
                    onClick={() => send('up')}
                    className={`px-3 py-1.5 text-lg rounded-full border transition-colors ${
                        rating === 'up' ? 'bg-emerald-100 border-emerald-300' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    👍
                </button>
                <button
                    type='button'
                    aria-label='Thumbs down'
                    onClick={() => send('down')}
                    className={`px-3 py-1.5 text-lg rounded-full border transition-colors ${
                        rating === 'down' ? 'bg-red-100 border-red-300' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    👎
                </button>
            </div>
            {rating && (
                <div className='flex items-center gap-2 mt-3'>
                    <input
                        type='text'
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={rating === 'down' ? 'What would have made it better? (optional)' : 'Anything to add? (optional)'}
                        className='flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500'
                    />
                    <button
                        type='button'
                        onClick={() => send(rating, comment)}
                        className='px-4 py-1.5 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700'
                    >
                        Send
                    </button>
                </div>
            )}
        </div>
    )
}

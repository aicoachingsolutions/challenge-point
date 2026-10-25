import { InformationCircleIcon } from '@heroicons/react/24/outline'

import type { IPathwayNotice } from '@/MODELS/activity.model'

/**
 * **The status beside an activity the checked pathway did not build** — the live-app status notice, 25 October 2026. Christian, reply filed
 * 26 October 2026, item 9(a): "Other Learning Goals may continue through their existing pathway during this transitional period, provided their
 * status and limitations are not misrepresented."
 *
 * Renders exactly what the server sent (`label` and `words`, DRAFT wording data) and nothing of its own: where nothing was sent - a checked
 * activity, or a server whose wording carries no notice - it renders nothing. `compact` shows the label alone, for a list of activities; the
 * full notice is shown where the activity itself is.
 */
export default function PathwayNotice({
    notice,
    compact = false,
    className = '',
}: {
    notice?: IPathwayNotice | null
    compact?: boolean
    className?: string
}) {
    const said = (text: unknown): text is string => typeof text === 'string' && text.trim().length > 0
    if (!notice || !said(notice.label) || !said(notice.words)) return null
    if (compact) {
        return (
            <p
                data-pathway-notice='label'
                title={notice.words}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-900 ${className}`}
            >
                <InformationCircleIcon className='flex-none w-4 h-4' aria-hidden='true' />
                {notice.label}
            </p>
        )
    }
    return (
        <div
            role='note'
            data-pathway-notice='notice'
            className={`flex gap-3 px-4 py-3 text-sm text-left border rounded-xl border-amber-300 bg-amber-50 text-amber-900 ${className}`}
        >
            <InformationCircleIcon className='flex-none w-5 h-5 mt-0.5 text-amber-700' aria-hidden='true' />
            <div className='min-w-0'>
                <p className='font-semibold'>{notice.label}</p>
                <p className='mt-1 break-words'>{notice.words}</p>
            </div>
        </div>
    )
}

import { ReactNode, useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api.service'

/**
 * TEMPORARY developer/testing view - field evidence for the coach pilot.
 * Read-only summary of rejected goals, coach-language leaks, activity edits,
 * observations, selection signals, and feedback. Backed by GET /api/app/debug-usage.
 */

type CountRow = {
    count: number
}

type UsageSummary = {
    since: string
    totals: Record<string, number>
    resolutionBreakdown: Record<string, number>
    topSignalGroups: Array<{ signalGroup: string; count: number }>
    topArchetypes: Array<{ archetype: string; count: number }>
    rejectedGoals: Array<{ goalText: string; count: number }>
    feedback: { up: number; down: number; comments: number }
    coachLanguageLeaks: Array<{ term: string; count: number }>
    activityEdits: {
        total: number
        structural: number
        topFields: Array<{ field: string; count: number }>
    }
    observations: {
        total: number
        byCode: Array<{ code: string; count: number }>
        byStage: Array<{ stage: string; count: number }>
    }
}

type UsageResult = UsageSummary & {
    error?: string
}

const emptySummary = (): UsageSummary => ({
    // Left blank rather than synthesised. `since` carries a server timestamp; inventing one here
    // would put a fabricated value in a field the reader is entitled to trust.
    since: '',
    totals: {},
    resolutionBreakdown: {},
    topSignalGroups: [],
    topArchetypes: [],
    rejectedGoals: [],
    feedback: { up: 0, down: 0, comments: 0 },
    coachLanguageLeaks: [],
    activityEdits: {
        total: 0,
        structural: 0,
        topFields: [],
    },
    observations: {
        total: 0,
        byCode: [],
        byStage: [],
    },
})

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className='p-4 bg-white border rounded-xl shadow-sm'>
            <h2 className='mb-3 text-sm font-bold text-gray-900'>{title}</h2>
            {children}
        </section>
    )
}

function EmptyRows({ label }: { label: string }) {
    return <p className='text-sm text-gray-500'>{label}</p>
}

function CountTable<T extends CountRow>({
    rows,
    emptyLabel,
    columns,
}: {
    rows: T[]
    emptyLabel: string
    columns: Array<{ label: string; render: (row: T) => ReactNode; className?: string }>
}) {
    if (rows.length === 0) {
        return <EmptyRows label={emptyLabel} />
    }

    return (
        <div className='overflow-x-auto border rounded-lg'>
            <table className='w-full text-sm text-left'>
                <thead className='text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50'>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.label} scope='col' className={`px-3 py-2 ${column.className ?? ''}`}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((column) => (
                                <td key={column.label} className={`px-3 py-2 align-top text-gray-800 ${column.className ?? ''}`}>
                                    {column.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function RecordTable({ values, emptyLabel }: { values: Record<string, number>; emptyLabel: string }) {
    const rows = Object.entries(values).map(([name, count]) => ({ name, count }))

    return (
        <CountTable
            rows={rows}
            emptyLabel={emptyLabel}
            columns={[
                { label: 'Name', render: (row) => row.name },
                { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
            ]}
        />
    )
}

function StatRow({ label, value }: { label: string; value: number | string }) {
    return (
        <div className='rounded-lg border bg-gray-50 px-3 py-2'>
            <dt className='text-xs font-semibold uppercase tracking-wide text-gray-500'>{label}</dt>
            <dd className='mt-1 text-lg font-bold text-gray-900'>{value}</dd>
        </div>
    )
}

export default function DebugUsage() {
    const [days, setDays] = useState(30)
    const [draftDays, setDraftDays] = useState('30')
    const [result, setResult] = useState<UsageResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [showRaw, setShowRaw] = useState(false)

    const fetchUsage = useCallback(async (nextDays: number) => {
        const safeDays = Number.isFinite(nextDays) && nextDays > 0 ? Math.floor(nextDays) : 30
        setDays(safeDays)
        setDraftDays(String(safeDays))
        setLoading(true)
        const res = await api<UsageSummary>(`app/debug-usage?days=${safeDays}`)
        setLoading(false)
        const summary = (res.data as UsageSummary | null) ?? emptySummary()
        setResult(res.error ? { ...summary, error: res.error } : summary)
    }, [])

    const run = async (nextDays = days) => {
        await fetchUsage(nextDays)
    }

    useEffect(() => {
        fetchUsage(30)
    }, [fetchUsage])

    const summary = result ?? emptySummary()
    const hasResult = result !== null
    const failed = Boolean(result?.error)

    return (
        <div className='max-w-5xl px-4 py-6 mx-auto'>
            <h1 className='mb-1 text-2xl font-bold text-gray-900'>Usage & Evidence</h1>
            <p className='mb-6 text-sm text-gray-500'>
                Field evidence collected for the coach pilot. Read-only summary from the authenticated debug endpoint.
            </p>

            <div className='p-4 mb-6 bg-white border rounded-xl shadow-sm'>
                <label className='block mb-1 text-sm font-medium text-gray-700'>Summary window</label>
                <div className='flex flex-wrap items-center gap-2'>
                    {[7, 30, 90].map((preset) => (
                        <button
                            key={preset}
                            type='button'
                            onClick={() => run(preset)}
                            disabled={loading}
                            className={`px-4 py-2 text-sm font-semibold rounded-full border ${
                                days === preset
                                    ? 'border-brand-600 bg-brand-600 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            } disabled:opacity-50`}
                        >
                            {preset} days
                        </button>
                    ))}
                    <input
                        type='number'
                        min={1}
                        value={draftDays}
                        onChange={(e) => setDraftDays(e.target.value)}
                        className='w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                    />
                    <button
                        type='button'
                        onClick={() => run(Number(draftDays))}
                        disabled={loading}
                        className='px-5 py-2 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50'
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/*
              A failed request must NOT render zeroed panels. This page exists to answer "is evidence
              being collected?", and a wall of zeros beside a small banner reads as "nothing happened"
              when the truth is "we couldn't ask". Those two answers must never look alike here.
            */}
            {hasResult && failed && (
                <div className='p-4 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-800'>
                    <p className='font-semibold'>Couldn't load the evidence summary.</p>
                    <p className='mt-1'>{result?.error}</p>
                    <p className='mt-2 text-amber-700'>
                        This is a failed request, not an empty dataset — the panels are hidden so the two aren't confused.
                    </p>
                </div>
            )}

            {hasResult && !failed && (
                <div className='space-y-5'>
                    <Panel title='Rejected Goals'>
                        <CountTable
                            rows={summary.rejectedGoals ?? []}
                            emptyLabel='No rejected goals in this window.'
                            columns={[
                                { label: 'Coach text', render: (row) => row.goalText || '-' },
                                { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
                            ]}
                        />
                    </Panel>

                    <Panel title='Observations'>
                        <dl className='grid grid-cols-1 gap-3 mb-4 sm:grid-cols-3'>
                            <StatRow label='Total' value={summary.observations?.total ?? 0} />
                        </dl>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                            <div>
                                <h3 className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>By code</h3>
                                <CountTable
                                    rows={summary.observations?.byCode ?? []}
                                    emptyLabel='No observation codes in this window.'
                                    columns={[
                                        { label: 'Code', render: (row) => row.code || '-' },
                                        { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
                                    ]}
                                />
                            </div>
                            <div>
                                <h3 className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>By stage</h3>
                                <CountTable
                                    rows={summary.observations?.byStage ?? []}
                                    emptyLabel='No observation stages in this window.'
                                    columns={[
                                        { label: 'Stage', render: (row) => row.stage || '-' },
                                        { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
                                    ]}
                                />
                            </div>
                        </div>
                    </Panel>

                    <Panel title='Coach-Language Leaks'>
                        <CountTable
                            rows={summary.coachLanguageLeaks ?? []}
                            emptyLabel='No coach-language leaks in this window.'
                            columns={[
                                { label: 'Term', render: (row) => row.term || '-' },
                                { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
                            ]}
                        />
                    </Panel>

                    <Panel title='Activity Edits'>
                        <dl className='grid grid-cols-1 gap-3 mb-4 sm:grid-cols-3'>
                            <StatRow label='Total' value={summary.activityEdits?.total ?? 0} />
                            <StatRow label='Structural' value={summary.activityEdits?.structural ?? 0} />
                        </dl>
                        <CountTable
                            rows={summary.activityEdits?.topFields ?? []}
                            emptyLabel='No edited fields in this window.'
                            columns={[
                                { label: 'Field', render: (row) => row.field || '-' },
                                { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
                            ]}
                        />
                    </Panel>

                    <Panel title='Resolution & Selection'>
                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                            <div>
                                <h3 className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>Resolution</h3>
                                <RecordTable values={summary.resolutionBreakdown ?? {}} emptyLabel='No resolution data in this window.' />
                            </div>
                            <div>
                                <h3 className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>Top signal groups</h3>
                                <CountTable
                                    rows={summary.topSignalGroups ?? []}
                                    emptyLabel='No signal groups in this window.'
                                    columns={[
                                        { label: 'Signal group', render: (row) => row.signalGroup || '-' },
                                        { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
                                    ]}
                                />
                            </div>
                            <div>
                                <h3 className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>Top archetypes</h3>
                                <CountTable
                                    rows={summary.topArchetypes ?? []}
                                    emptyLabel='No archetypes in this window.'
                                    columns={[
                                        { label: 'Archetype', render: (row) => row.archetype || '-' },
                                        { label: 'Count', render: (row) => row.count, className: 'w-24 text-right' },
                                    ]}
                                />
                            </div>
                        </div>
                    </Panel>

                    <Panel title='Feedback'>
                        <dl className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                            <StatRow label='Up' value={summary.feedback?.up ?? 0} />
                            <StatRow label='Down' value={summary.feedback?.down ?? 0} />
                            <StatRow label='Comments' value={summary.feedback?.comments ?? 0} />
                        </dl>
                    </Panel>

                    <Panel title='Totals'>
                        <p className='mb-3 text-sm text-gray-600'>
                            <span className='font-semibold text-gray-800'>Since:</span> {summary.since || '-'}
                        </p>
                        <RecordTable values={summary.totals ?? {}} emptyLabel='No events in this window.' />
                    </Panel>

                    <div>
                        <button
                            type='button'
                            onClick={() => setShowRaw((s) => !s)}
                            className='text-sm font-medium text-brand-700 hover:text-brand-900'
                        >
                            {showRaw ? 'Hide raw JSON' : 'Show raw JSON'}
                        </button>
                        {showRaw && (
                            <pre className='p-4 mt-2 overflow-auto text-xs text-gray-700 bg-gray-50 border rounded-lg max-h-96'>
                                {JSON.stringify(summary, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

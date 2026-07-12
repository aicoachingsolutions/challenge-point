import { useState } from 'react'
import { api } from '@/services/api.service'

/**
 * TEMPORARY developer/testing view — Knowledge Core Package 1.1 experiment (Christian's review).
 * Type a coaching goal and see the canonical Environmental Manipulation reasoning: which canonical
 * Knowledge Objects were reached, via which coach phrases and affordance affinities, with each
 * candidate's canonical Engineering Dimensions (+ Parameters) and Ecological Guidance attached.
 * Deterministic, read-only — no AI, no effect on live generation.
 * Backed by GET /api/app/debug-em-reasoning. Route out before any production polish pass.
 */

type EmCandidate = {
    koId: string
    koName: string
    familyName: string
    matchedTerms: string[]
    affinityHits: Array<{ affordance: string; weight: number }>
    score: number
    dimensions: Array<{ dimId: string; name: string; parameters: string[] }>
    guidance: string[]
}

type EmDebugResult = {
    learningGoal?: string
    knowledgeCore?: { schema?: string; version?: string }
    derivedTargetAffordances?: string[]
    selectedLenses?: string[]
    selectionNote?: string
    canonicalCandidates?: EmCandidate[]
    note?: string
    error?: string
}

export default function DebugEmReasoning() {
    const [goal, setGoal] = useState('')
    const [result, setResult] = useState<EmDebugResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [showRaw, setShowRaw] = useState(false)

    const run = async () => {
        const trimmed = goal.trim()
        if (!trimmed) return
        setLoading(true)
        setResult(null)
        const res = await api<EmDebugResult>(`app/debug-em-reasoning?goal=${encodeURIComponent(trimmed)}`)
        setLoading(false)
        setResult((res.data as EmDebugResult) ?? { error: res.error ?? 'No response' })
    }

    const candidates = result?.canonicalCandidates ?? []
    const topScore = candidates[0]?.score ?? 0

    return (
        <div className='max-w-3xl px-4 py-6 mx-auto'>
            <h1 className='mb-1 text-2xl font-bold text-gray-900'>Knowledge Core — EM Reasoning</h1>
            <p className='mb-6 text-sm text-gray-500'>
                Canonical Environmental Manipulation reasoning (Package 1.1). Shows which canonical Knowledge Objects a
                coaching goal reaches, with full traceability. Deterministic, read-only — no AI, no effect on
                generation.
            </p>

            <div className='p-4 mb-6 bg-white border rounded-xl shadow-sm'>
                <label className='block mb-1 text-sm font-medium text-gray-700'>Coaching goal</label>
                <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run()
                    }}
                    rows={2}
                    placeholder='e.g. keep possession in tight spaces / players read which goal is open'
                    className='w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                />
                <div className='flex items-center gap-3'>
                    <button
                        type='button'
                        onClick={run}
                        disabled={loading || !goal.trim()}
                        className='px-5 py-2 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50'
                    >
                        {loading ? 'Reasoning…' : 'Run'}
                    </button>
                    <span className='text-xs text-gray-400'>⌘/Ctrl+Enter</span>
                </div>
            </div>

            {result && (
                <div className='space-y-5'>
                    {result.error && (
                        <div className='p-4 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-800'>
                            {result.error}
                        </div>
                    )}

                    {result.knowledgeCore && (
                        <div className='p-4 bg-white border rounded-xl shadow-sm'>
                            <h2 className='text-sm font-bold text-gray-900'>Reasoning inputs</h2>
                            <p className='mt-2 text-sm text-gray-800'>
                                <span className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
                                    Canonical source:{' '}
                                </span>
                                {result.knowledgeCore.schema} <span className='text-gray-400'>{result.knowledgeCore.version}</span>
                            </p>
                            <p className='mt-1 text-sm text-gray-800'>
                                <span className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
                                    Selected lenses (engine):{' '}
                                </span>
                                {(result.selectedLenses ?? []).join(', ') || '—'}
                            </p>
                            <p className='mt-1 text-sm text-gray-800'>
                                <span className='text-xs font-semibold uppercase tracking-wide text-gray-400'>
                                    Derived target affordances:{' '}
                                </span>
                                {(result.derivedTargetAffordances ?? []).join(', ') || '—'}
                            </p>
                            {result.selectionNote && <p className='mt-2 text-xs text-amber-700'>{result.selectionNote}</p>}
                        </div>
                    )}

                    <div>
                        <h2 className='mb-2 text-sm font-bold text-gray-900'>
                            Canonical Knowledge Objects reached ({candidates.length})
                        </h2>
                        {candidates.length === 0 && (
                            <p className='text-sm text-gray-500'>No canonical Knowledge Objects reached for this goal.</p>
                        )}
                        <div className='space-y-3'>
                            {candidates.map((c, i) => {
                                const pct = topScore > 0 ? Math.max(4, Math.round((c.score / topScore) * 100)) : 0
                                return (
                                    <div
                                        key={c.koId}
                                        className={`p-4 rounded-xl border shadow-sm ${
                                            i === 0 ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className='flex items-center gap-2'>
                                            <span className={`text-sm ${i === 0 ? 'font-bold text-emerald-800' : 'font-semibold text-gray-800'}`}>
                                                {i + 1}. {c.koName}
                                            </span>
                                            <span className='text-xs text-gray-400'>
                                                {c.koId} · {c.familyName}
                                            </span>
                                            <span className='ml-auto text-sm font-semibold text-gray-900'>{c.score}</span>
                                        </div>
                                        <div className='h-1 mt-1 mb-2 overflow-hidden bg-gray-200 rounded'>
                                            <div className={`h-full ${i === 0 ? 'bg-emerald-500' : 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className='text-xs text-gray-600'>
                                            <span className='font-semibold'>Reached via:</span>{' '}
                                            {c.matchedTerms.length ? c.matchedTerms.join(', ') : '—'}
                                            {c.affinityHits.length > 0 && (
                                                <>
                                                    {' '}
                                                    <span className='font-semibold'>· affordance affinity:</span>{' '}
                                                    {c.affinityHits.map((h) => `${h.affordance} (+${h.weight})`).join(', ')}
                                                </>
                                            )}
                                        </p>
                                        <p className='mt-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
                                            Design levers (canonical dimensions)
                                        </p>
                                        <ul className='mt-1 space-y-0.5'>
                                            {c.dimensions.map((d) => (
                                                <li key={d.dimId} className='text-xs text-gray-700'>
                                                    <span className='font-semibold'>{d.name}</span>{' '}
                                                    <span className='text-gray-400'>({d.dimId})</span>
                                                    {d.parameters.length > 0 && <> — {d.parameters.join('; ')}</>}
                                                </li>
                                            ))}
                                        </ul>
                                        {c.guidance.length > 0 && (
                                            <>
                                                <p className='mt-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
                                                    Ecological guidance
                                                </p>
                                                <ul className='mt-1 space-y-0.5 list-disc list-inside'>
                                                    {c.guidance.map((g) => (
                                                        <li key={g} className='text-xs text-gray-600'>
                                                            {g}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

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
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        )}
                    </div>

                    {result.note && <p className='text-xs italic text-gray-400'>{result.note}</p>}
                </div>
            )}
        </div>
    )
}

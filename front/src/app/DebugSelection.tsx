import { useState } from 'react'
import { api } from '@/services/api.service'

/**
 * TEMPORARY developer/testing view (Christian's request). Type a learning goal, hit Run, and see
 * the internal generation decisions (resolution -> selection -> deterministic validation) WITHOUT
 * going through the session-creation flow (field size / age / skill level) and WITHOUT spending an
 * OpenAI generation. Backed by GET /api/app/debug-selection. Defaults are auto-applied so the only
 * required input is the goal.
 *
 * Not a coach-facing feature — route it out before any production polish pass.
 */

type DebugResult = {
    learningGoal?: string
    resolution?: {
        resolvedGameProblem?: string[]
        roleContextDetected?: string
        allMatchedSignals?: string[]
        candidateArchetypeIds?: string[]
        candidateAffordanceLensIds?: string[]
        candidateConstraintIds?: string[]
    }
    selection?: {
        selectedArchetype?: { id?: string; name?: string }
        selectedAffordances?: string[]
        selectedConstraints?: string[]
        selectionTrace?: unknown
    } | null
    validation?: {
        deterministicPass?: boolean
        failureStage?: string | null
        failureReason?: string | null
    }
    note?: string
    error?: string
}

const CHALLENGE_LEVELS = ['low', 'medium', 'high'] as const

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1'>{label}</p>
            <div className='text-sm text-gray-800'>{children}</div>
        </div>
    )
}

export default function DebugSelection() {
    const [goal, setGoal] = useState('')
    const [challengeLevel, setChallengeLevel] = useState<(typeof CHALLENGE_LEVELS)[number]>('medium')
    const [players, setPlayers] = useState(14)
    const [result, setResult] = useState<DebugResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [showRaw, setShowRaw] = useState(false)

    const run = async () => {
        const trimmed = goal.trim()
        if (!trimmed) return
        setLoading(true)
        setResult(null)
        const qs = `goal=${encodeURIComponent(trimmed)}&challengeLevel=${challengeLevel}&players=${players}`
        const res = await api<DebugResult>(`app/debug-selection?${qs}`)
        setLoading(false)
        setResult((res.data as DebugResult) ?? { error: res.error ?? 'No response' })
    }

    const v = result?.validation
    const pass = v?.deterministicPass

    return (
        <div className='max-w-3xl px-4 py-6 mx-auto'>
            <h1 className='mb-1 text-2xl font-bold text-gray-900'>Selection Debug</h1>
            <p className='mb-6 text-sm text-gray-500'>
                Internal generation decisions for a learning goal. Deterministic only — no AI call, no quota used.
                Developer view, not coach-facing.
            </p>

            <div className='p-4 mb-6 bg-white border rounded-xl shadow-sm'>
                <label className='block mb-1 text-sm font-medium text-gray-700'>Learning goal</label>
                <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run()
                    }}
                    rows={2}
                    placeholder='e.g. protecting central space in front of goal'
                    className='w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                />
                <div className='flex flex-wrap items-end gap-3'>
                    <div>
                        <label className='block mb-1 text-xs font-medium text-gray-500'>Challenge level</label>
                        <select
                            value={challengeLevel}
                            onChange={(e) => setChallengeLevel(e.target.value as (typeof CHALLENGE_LEVELS)[number])}
                            className='px-2 py-1.5 text-sm border border-gray-300 rounded-lg'
                        >
                            {CHALLENGE_LEVELS.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className='block mb-1 text-xs font-medium text-gray-500'>Players</label>
                        <input
                            type='number'
                            value={players}
                            min={1}
                            max={50}
                            onChange={(e) => setPlayers(Number.parseInt(e.target.value, 10) || 14)}
                            className='w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg'
                        />
                    </div>
                    <button
                        type='button'
                        onClick={run}
                        disabled={loading || !goal.trim()}
                        className='px-5 py-2 text-sm font-semibold text-white rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50'
                    >
                        {loading ? 'Running…' : 'Run'}
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

                    {/* Validation status banner */}
                    {v && (
                        <div
                            className={`p-4 rounded-lg border ${
                                pass ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                            }`}
                        >
                            <p className={`text-sm font-semibold ${pass ? 'text-green-700' : 'text-red-700'}`}>
                                Deterministic validation: {pass ? 'PASS' : 'FAIL'}
                            </p>
                            {!pass && (
                                <p className='mt-1 text-sm text-red-700'>
                                    <span className='font-medium'>{v.failureStage}</span> — {v.failureReason}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Resolution */}
                    {result.resolution && (
                        <div className='p-4 space-y-3 bg-white border rounded-xl shadow-sm'>
                            <h2 className='text-sm font-bold text-gray-900'>Resolution</h2>
                            <Field label='Resolved game problem'>
                                {(result.resolution.resolvedGameProblem ?? []).join(', ') || '—'}
                            </Field>
                            <Field label='Role context detected'>{result.resolution.roleContextDetected ?? '—'}</Field>
                            <Field label='Candidate archetypes'>
                                {(result.resolution.candidateArchetypeIds ?? []).join(', ') || '—'}
                            </Field>
                            <Field label='Candidate affordances'>
                                {(result.resolution.candidateAffordanceLensIds ?? []).join(', ') || '—'}
                            </Field>
                            <Field label='Candidate constraints'>
                                {(result.resolution.candidateConstraintIds ?? []).join(', ') || '—'}
                            </Field>
                        </div>
                    )}

                    {/* Selection */}
                    {result.selection && (
                        <div className='p-4 space-y-3 bg-white border rounded-xl shadow-sm'>
                            <h2 className='text-sm font-bold text-gray-900'>Selection</h2>
                            <Field label='Selected archetype'>
                                <span className='font-semibold'>{result.selection.selectedArchetype?.name}</span>{' '}
                                <span className='text-gray-400'>({result.selection.selectedArchetype?.id})</span>
                            </Field>
                            <Field label='Selected affordances'>
                                {(result.selection.selectedAffordances ?? []).join(', ') || '—'}
                            </Field>
                            <Field label='Selected constraints / incentives'>
                                {(result.selection.selectedConstraints ?? []).join(', ') || '—'}
                            </Field>
                        </div>
                    )}

                    <div>
                        <button
                            type='button'
                            onClick={() => setShowRaw((s) => !s)}
                            className='text-sm font-medium text-brand-700 hover:text-brand-900'
                        >
                            {showRaw ? 'Hide raw JSON' : 'Show raw JSON (incl. selection trace)'}
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

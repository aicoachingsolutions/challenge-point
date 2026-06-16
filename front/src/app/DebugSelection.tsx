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

type RankingEntry = {
    id: string
    name: string
    score: number
    reasons: string[]
    selected: boolean
    eligible: boolean
}

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
        ranking?: {
            archetypes?: RankingEntry[]
            affordanceLenses?: RankingEntry[]
            constraints?: RankingEntry[]
            archetypeMargin?: number | null
        }
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

function RankingList({ title, margin, entries }: { title: string; margin?: number | null; entries?: RankingEntry[] }) {
    if (!entries || entries.length === 0) return null
    const top = entries[0]?.score ?? 0
    return (
        <div>
            <div className='flex items-center justify-between mb-2'>
                <p className='text-xs font-semibold tracking-wide text-gray-500 uppercase'>{title}</p>
                {typeof margin === 'number' && (
                    <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            margin === 0
                                ? 'bg-red-100 text-red-700'
                                : margin <= 4
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                        }`}
                    >
                        {margin === 0 ? 'tie — broken by routing order' : `won by ${margin}`}
                    </span>
                )}
            </div>
            <ol className='space-y-1'>
                {entries.map((e) => {
                    const pct = top > 0 && e.score > 0 ? Math.max(4, Math.round((e.score / top) * 100)) : 0
                    return (
                        <li
                            key={e.id}
                            className={`px-3 py-2 rounded-lg border ${
                                e.selected ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'
                            }`}
                        >
                            <div className='flex items-center gap-2'>
                                <span
                                    className={`text-sm ${
                                        e.selected ? 'font-bold text-emerald-800' : 'font-medium text-gray-700'
                                    } ${e.eligible ? '' : 'opacity-60'}`}
                                >
                                    {e.name}
                                </span>
                                {e.selected && (
                                    <span className='text-[10px] font-bold uppercase text-emerald-600'>selected</span>
                                )}
                                {!e.eligible && (
                                    <span
                                        title='Scored, but routing left it out of the candidate pool — a routing gap, not coverage.'
                                        className='text-[10px] font-bold uppercase text-amber-600'
                                    >
                                        routed out
                                    </span>
                                )}
                                <span className='ml-auto text-sm font-semibold text-gray-900'>{e.score}</span>
                            </div>
                            <div className='h-1 mt-1 overflow-hidden bg-gray-200 rounded'>
                                <div
                                    className={`h-full ${e.selected ? 'bg-emerald-500' : 'bg-gray-400'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            {e.reasons && e.reasons.length > 0 && (
                                <p className='mt-1 text-[11px] leading-snug text-gray-500'>{e.reasons.join(' · ')}</p>
                            )}
                        </li>
                    )
                })}
            </ol>
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

                    {/* Why it won — candidate rankings (developer instrumentation) */}
                    {result.selection?.ranking && (
                        <div className='p-4 space-y-5 bg-white border rounded-xl shadow-sm'>
                            <div>
                                <h2 className='text-sm font-bold text-gray-900'>Why it won — candidate rankings</h2>
                                <p className='mt-0.5 text-xs text-gray-500'>
                                    Score = token-overlap with the candidate's library text + bonuses (archetype-affordance
                                    match, target-lens match, phase anchor); reasons show what contributed. A thin margin =
                                    fragile interpretation; a high score marked “routed out” = routing gap, not coverage.
                                </p>
                            </div>
                            <RankingList
                                title='Archetypes (routed candidates)'
                                margin={result.selection.ranking.archetypeMargin}
                                entries={result.selection.ranking.archetypes}
                            />
                            <RankingList
                                title='Affordance lenses (full library)'
                                entries={result.selection.ranking.affordanceLenses}
                            />
                            <RankingList
                                title='Constraints (full library)'
                                entries={result.selection.ranking.constraints}
                            />
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

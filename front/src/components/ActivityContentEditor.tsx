import { useState } from 'react'

import { IActivity } from '@/MODELS/activity.model'

/**
 * Coach editing of a generated activity (Coach Intelligence §18, a Pilot 1 capability).
 *
 * Editing is deliberately unrestricted. Coach Intelligence §38 records a coach's decision and does
 * not judge it, and Coach Autonomy is a governing principle — so a coach may change the scoring, the
 * rules, anything. The backend classifies each edit as presentation or structural and records it as
 * evidence; it never refuses one. A field coaches rewrite constantly is a field the engine is
 * getting wrong, and that is worth far more to us than a guardrail that annoys them.
 *
 * The one thing we do surface is a quiet note when an edit touches the activity's structure — not
 * to discourage it, but because a coach changing scoring should know they are changing what the
 * activity teaches, not just how it reads.
 */

/** Fields the coach may edit, in the order they appear on the page. */
export interface ActivityContentDraft {
    title: string
    intent: string
    setup: string
    teams: string
    rules: string[]
    scoringSystem: string
    winCondition: string
    scaffolding: string[]
}

/** Editing any of these changes what the activity IS, not merely how it reads. */
const STRUCTURAL_FIELDS: ReadonlyArray<keyof ActivityContentDraft> = [
    'intent',
    'setup',
    'teams',
    'rules',
    'scoringSystem',
    'winCondition',
]

export function draftFromActivity(activity: IActivity): ActivityContentDraft {
    return {
        title: activity.title ?? '',
        intent: activity.intent ?? '',
        setup: typeof activity.setup === 'string' ? activity.setup : '',
        teams: activity.extensions?.[0] ?? '',
        rules: [...(activity.rules ?? [])],
        scoringSystem: activity.scoringSystem ?? '',
        winCondition: activity.winCondition ?? '',
        scaffolding: [...(activity.scaffolding ?? [])],
    }
}

function Field({
    label,
    value,
    onChange,
    rows = 3,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    rows?: number
}) {
    return (
        <div>
            <label className='block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase'>{label}</label>
            <textarea
                value={value}
                rows={rows}
                onChange={(e) => onChange(e.target.value)}
                className='w-full px-3 py-2 text-sm leading-relaxed text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
            />
        </div>
    )
}

/** A list of short text lines with add/remove — used for rules and coaching cues. */
function ListField({
    label,
    values,
    onChange,
    addLabel,
}: {
    label: string
    values: string[]
    onChange: (v: string[]) => void
    addLabel: string
}) {
    return (
        <div>
            <label className='block mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase'>{label}</label>
            <div className='space-y-2'>
                {values.map((entry, i) => (
                    <div key={i} className='flex gap-2'>
                        <textarea
                            value={entry}
                            rows={2}
                            onChange={(e) => {
                                const next = [...values]
                                next[i] = e.target.value
                                onChange(next)
                            }}
                            className='flex-1 px-3 py-2 text-sm leading-relaxed text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                        />
                        <button
                            type='button'
                            aria-label={`Remove ${label} ${i + 1}`}
                            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                            className='px-2 text-gray-400 rounded-lg hover:text-red-600 hover:bg-red-50'
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
            <button
                type='button'
                onClick={() => onChange([...values, ''])}
                className='mt-2 text-sm font-medium text-brand-600 hover:text-brand-700'
            >
                + {addLabel}
            </button>
        </div>
    )
}

export default function ActivityContentEditor({
    activity,
    onSave,
    onCancel,
}: {
    activity: IActivity
    onSave: (draft: ActivityContentDraft) => Promise<void>
    onCancel: () => void
}) {
    const [draft, setDraft] = useState<ActivityContentDraft>(() => draftFromActivity(activity))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const original = draftFromActivity(activity)
    const same = (a: string | string[], b: string | string[]) =>
        Array.isArray(a) || Array.isArray(b)
            ? JSON.stringify((a as string[]).map((s) => s.trim())) === JSON.stringify((b as string[]).map((s) => s.trim()))
            : (a as string).trim() === (b as string).trim()

    const changedFields = (Object.keys(draft) as Array<keyof ActivityContentDraft>).filter(
        (k) => !same(draft[k], original[k])
    )
    const structuralChanges = changedFields.filter((k) => STRUCTURAL_FIELDS.includes(k))

    const set = <K extends keyof ActivityContentDraft>(key: K, value: ActivityContentDraft[K]) =>
        setDraft((d) => ({ ...d, [key]: value }))

    const save = async () => {
        setSaving(true)
        setError(null)
        try {
            // Blank entries are a side effect of the add button, not content the coach meant to keep.
            await onSave({
                ...draft,
                rules: draft.rules.map((r) => r.trim()).filter(Boolean),
                scaffolding: draft.scaffolding.map((s) => s.trim()).filter(Boolean),
            })
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save your changes. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className='space-y-5'>
            <Field label='Title' value={draft.title} onChange={(v) => set('title', v)} rows={1} />
            <Field label='Objective' value={draft.intent} onChange={(v) => set('intent', v)} />
            <Field label='Setup' value={draft.setup} onChange={(v) => set('setup', v)} rows={4} />
            <Field label='Teams' value={draft.teams} onChange={(v) => set('teams', v)} rows={2} />
            <ListField label='Rules' values={draft.rules} onChange={(v) => set('rules', v)} addLabel='Add rule' />
            <Field label='Scoring' value={draft.scoringSystem} onChange={(v) => set('scoringSystem', v)} />
            <Field label='Win condition' value={draft.winCondition} onChange={(v) => set('winCondition', v)} rows={2} />
            <ListField
                label='Coaching cues'
                values={draft.scaffolding}
                onChange={(v) => set('scaffolding', v)}
                addLabel='Add cue'
            />

            {structuralChanges.length > 0 && (
                <div className='px-4 py-3 text-sm border rounded-lg border-slate-200 bg-slate-50 text-slate-700'>
                    You've changed how the activity works, not just how it reads. That's fine — it's your session.
                    Worth a second look at whether players still face the problem you picked this activity for.
                </div>
            )}

            {error && (
                <div className='px-4 py-3 text-sm border rounded-lg border-amber-200 bg-amber-50 text-amber-800'>
                    {error}
                </div>
            )}

            <div className='flex gap-3'>
                <button
                    type='button'
                    onClick={save}
                    disabled={saving || changedFields.length === 0}
                    className='px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                    type='button'
                    onClick={onCancel}
                    disabled={saving}
                    className='px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50'
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}

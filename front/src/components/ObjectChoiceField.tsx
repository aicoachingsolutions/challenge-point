import { useState } from 'react'
import { NumberField } from '@/form-control/fields'

import type { ObjectChoice, StatedObjects } from '@/MODELS/activity-review.model'

/**
 * **A session's objects of one kind, stated by a choice** — stage I, 24 October 2026 (the d27 design's stage I(a) and (c); labels DRAFT).
 *
 * Christian, reply filed 26 October 2026, item 4: "I agree that the coach should identify the available goal type and dimensions, without
 * the engine inventing them." Item 11: "Do not infer a goal from the presence of a goalkeeper or silently treat missing information as
 * confirmation that no goal exists."
 *
 * One component for every place the session's objects are stated: the session form, and the build's question on the review page and the
 * live page ("with the same choices"). The choices are the server's (`ObjectChoice`, back/src/system/rendering/session-object-choices.ts):
 * each authorized object, named with its document and size, states its width and type EXACTLY as its source records them, so the server's
 * exact width match needs no tolerance and no number field truncates it; another object takes a width typed as the coach measures it (any
 * step, so a rounded figure stays the figure typed and is matched as itself); none states a count of 0. No choice, value or label is named
 * here. The coach always says how many: nothing is stated until a whole number of one or more is given (blank is not stated, never one).
 * Where the server offers no choices, the count and width are asked as before.
 */
export interface ObjectChoiceFieldProps {
    kind: string
    choices: ObjectChoice[]
    /** The statement as it stands (stored, or answered for this review), or undefined where nothing is stated. */
    value?: StatedObjects
    /** Called with the statement the coach has made, or undefined where what is entered states nothing yet. */
    onChange: (statement: StatedObjects | undefined) => void
    /** The label of an option stating nothing ("Not sure yet"), offered only where leaving the kind unstated is an answer (the session form). */
    notSureLabel?: string
    /** Disables every input (e.g. while a build is running). */
    disabled?: boolean
    /** A name unique on the page for the radio group. */
    name: string
}

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0
const isWidth = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
const NOT_SURE = ''

/**
 * Which choice a statement was made by: a count of none is `none`; a statement holding every value a choice states (widths compared exactly,
 * as the server compares them) is that choice; any other statement with a width is the choice whose width the coach enters. Undefined where
 * nothing is stated.
 */
export function choiceOf(choices: ObjectChoice[], value: StatedObjects | undefined): string | undefined {
    if (!value || !isCount(value.count)) return undefined
    if (value.count === 0) return choices.find((choice) => choice.enters.length === 0)?.id
    const named = choices.find((choice) => choice.enters.length > 0 && Object.keys(choice.states).length > 0 && Object.entries(choice.states).every(([key, stated]) => value[key] === stated))
    if (named) return named.id
    return choices.find((choice) => choice.enters.includes('widthM'))?.id
}

/** The statement a choice makes with what the coach entered, or undefined where something it needs is not entered yet. */
export function statementOf(choice: ObjectChoice | undefined, count: number | undefined, widthM: number | undefined): StatedObjects | undefined {
    if (!choice) return undefined
    if (choice.enters.length === 0) return isCount(choice.states.count) ? ({ ...choice.states } as StatedObjects) : undefined
    if (choice.enters.includes('count') && !(isCount(count) && count >= 1)) return undefined
    if (choice.enters.includes('widthM') && !isWidth(widthM)) return undefined
    return { ...choice.states, count: count as number, ...(choice.enters.includes('widthM') ? { widthM } : {}) } as StatedObjects
}

export default function ObjectChoiceField({ kind, choices, value, onChange, notSureLabel, disabled, name }: ObjectChoiceFieldProps) {
    const [picked, setPicked] = useState<string | undefined>(undefined)
    const [count, setCount] = useState<number | undefined>(undefined)
    const [width, setWidth] = useState<number | undefined>(undefined)
    const chosenId = picked ?? choiceOf(choices, value) ?? NOT_SURE
    const chosen = choices.find((choice) => choice.id === chosenId)
    const countNow = count ?? (isCount(value?.count) && value!.count >= 1 ? value!.count : undefined)
    const widthNow = width ?? (chosen?.enters.includes('widthM') && isWidth(value?.widthM) ? value!.widthM : undefined)

    const change = (next: { id?: string; count?: number; width?: number }) => {
        const id = next.id ?? chosenId
        const nextCount = 'count' in next ? next.count : countNow
        const nextWidth = 'width' in next ? next.width : widthNow
        onChange(id === NOT_SURE ? undefined : statementOf(choices.find((choice) => choice.id === id), nextCount, nextWidth))
    }

    if (!choices.length) {
        // No choices from the server: the count and width are asked as before (stage E).
        return (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <NumberField
                    label={`How many ${kind}s can you use today?`}
                    value={isCount(value?.count) ? value!.count : undefined}
                    onChange={(entered) => onChange(isCount(entered) ? { ...(value ?? {}), count: entered } : undefined)}
                    min={0}
                    step={1}
                    disabled={disabled}
                    placeholder='Enter a number — 0 if none'
                    labelClass='text-gray-700 font-medium mb-2 block'
                    inputClass='text-base'
                />
                <NumberField
                    label='How wide are they, in metres?'
                    value={isWidth(value?.widthM) ? value!.widthM : undefined}
                    onChange={(entered) => isCount(value?.count) && onChange({ ...(value as StatedObjects), ...(isWidth(entered) ? { widthM: entered } : { widthM: undefined }) })}
                    min={0}
                    step='any'
                    disabled={disabled || !isCount(value?.count) || value!.count === 0}
                    labelClass='text-gray-700 font-medium mb-2 block'
                    inputClass='text-base'
                />
            </div>
        )
    }

    return (
        <fieldset className='space-y-2' disabled={disabled}>
            {notSureLabel !== undefined && (
                <label className='flex items-start gap-2 cursor-pointer'>
                    <input
                        type='radio'
                        name={name}
                        className='mt-1'
                        checked={chosenId === NOT_SURE}
                        onChange={() => {
                            setPicked(NOT_SURE)
                            change({ id: NOT_SURE })
                        }}
                    />
                    <span className='text-gray-800'>{notSureLabel}</span>
                </label>
            )}
            {choices.map((choice) => (
                <div key={choice.id}>
                    <label className='flex items-start gap-2 cursor-pointer'>
                        <input
                            type='radio'
                            name={name}
                            className='mt-1'
                            checked={chosenId === choice.id}
                            onChange={() => {
                                setPicked(choice.id)
                                change({ id: choice.id })
                            }}
                        />
                        <span className='text-gray-800'>{choice.label}</span>
                    </label>
                    {chosenId === choice.id && choice.enters.length > 0 && (
                        <div className='grid grid-cols-1 gap-4 mt-2 ml-6 md:grid-cols-2'>
                            {choice.enters.includes('count') && (
                                <NumberField
                                    label={`How many ${kind}s like this?`}
                                    value={countNow}
                                    onChange={(entered) => {
                                        const next = isCount(entered) && entered >= 1 ? entered : undefined
                                        setCount(next)
                                        change({ count: next })
                                    }}
                                    min={1}
                                    step={1}
                                    placeholder='e.g. 1'
                                    labelClass='text-gray-700 font-medium mb-2 block'
                                    inputClass='text-base'
                                />
                            )}
                            {choice.enters.includes('widthM') && (
                                <NumberField
                                    label='How wide, in metres?'
                                    value={widthNow}
                                    onChange={(entered) => {
                                        const next = isWidth(entered) ? entered : undefined
                                        setWidth(next)
                                        change({ width: next })
                                    }}
                                    min={0}
                                    step='any'
                                    placeholder='as measured'
                                    labelClass='text-gray-700 font-medium mb-2 block'
                                    inputClass='text-base'
                                />
                            )}
                        </div>
                    )}
                </div>
            ))}
        </fieldset>
    )
}

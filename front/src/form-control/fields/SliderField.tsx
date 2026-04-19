import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormValidation, useInputLabel, useInputValue } from '@/form-control'
import { useWindowWidth } from '@/hooks'

import { cn } from '@/utils/cn'

import Loading from '@/components/Loading'

import { ISelectOption, OptionsListConfig } from '../hooks'
import { FieldProps } from './BaseField'

type MultiSliderFieldProps<FormValuesType> = FieldProps<string, FormValuesType> & {
    options: ISelectOption[]
    // optionsListConfig?: OptionsListConfig
    rounded?: string // tailwind CSS rounded class default 'rounded-full'
    pillClass?: string | ((value?: string) => string) // style the slider pill
    colorScheme?: 'default' | 'tricolor-blue' | 'tricolor-red' // Add a color scheme option
}

export default function SliderField<FormValuesType = any>({
    options,
    rounded = 'rounded-full',
    colorScheme,

    // Inside FormWrapper
    field,
    formValues,
    setFormValues,
    formOptions,
    // Standalone
    value,
    onChange,
    //
    label,
    containerClass,
    labelClass,
    inputClass,
    pillClass,
    ...rest
}: MultiSliderFieldProps<FormValuesType>) {
    if (rest && Object.keys(rest).filter((d) => !['required'].includes(d)).length > 0) {
        console.warn('SliderField does not use a HTML Input component, so additional props are not supported.')
    }

    const { inputValue, handleChange } = useInputValue(value, onChange, field, formValues, setFormValues, formOptions)
    const { inputLabel } = useInputLabel(label, field, formOptions)

    const { isValid, ValidationPrompt } = useFormValidation(formValues ?? {}, inputValue, field, formOptions)

    // const { selectOptions } = useOptionsList({ options, optionsListConfig })

    const slideRef = useRef<HTMLUListElement | null>(null)
    const [slidePosition, setSlidePosition] = useState<number>(0)

    const windowWidth = useWindowWidth()
    const { pillWidth, pillTransform } = useMemo(() => {
        return {
            pillWidth: ((slideRef.current?.offsetWidth ?? 0) - 4) / (options.length || 1),
            pillTransform: `translate(${slidePosition + 'px'})`,
        }
    }, [windowWidth, slideRef?.current, options?.length, slidePosition])

    useEffect(() => {
        if (!inputValue) {
            handleChange(options[0]?.value)
        }
    }, [inputValue, options])

    useEffect(() => {
        if (slideRef.current && options.length > 0) {
            let idx = options.findIndex((d) => d.value === inputValue)
            if (idx === -1) {
                setSlidePosition(0)
                handleChange(options[0]?.value)
            } else {
                setSlidePosition(pillWidth * idx)
            }
        }
    }, [inputValue, slideRef, options, pillWidth])

    // Function to get pill color based on selected value
    const getPillColor = (selectedValue: string) => {
        if (!colorScheme || options.length !== 3) return '';
        
        const idx = options.findIndex(opt => opt.value === selectedValue);
        if (colorScheme === 'tricolor-blue') {switch(idx) {
            case 0: return 'bg-gray-300';
            case 1: return 'bg-blue-300';
            case 2: return 'bg-blue-500';
            default: return '';
        }}
        if (colorScheme === 'tricolor-red') {switch(idx) {
            case 0: return 'bg-gray-300';
            case 1: return 'bg-blue-500';
            case 2: return 'bg-red-600';
            default: return '';
        }}
    }

    // Function to get background color based on options
    const getBackgroundStyle = () => {
        if (!colorScheme || options.length !== 3) return {};
        
        if (colorScheme === 'tricolor-blue')return {
            background: 'linear-gradient(to right, #e5e7eb 33.33%, #ADD8E6 33.33% 66.66%, #00BFFF 66.66%)',
            
        };
        if (colorScheme === 'tricolor-red')return {
            background: 'linear-gradient(to right, #e5e7eb 33.33%, #00BFFF 33.33% 66.66%, #ef4444 66.66%)',
            
        };
    }

    if (!options) return <Loading size={24} />

    return (
        <div className={cn('field-container', containerClass)}>
            {inputLabel && (
                <label className={cn('field-label', labelClass)}>
                    {inputLabel} {rest?.required && <span className='text-red-500'>*</span>}
                </label>
            )}
            <ul
                ref={slideRef}
                className={cn(
                    'field-input',
                    'h-[40px] px-[2px]',
                    colorScheme ? '' : 'bg-neutral-100 ring-neutral-100',
                    inputClass,
                    rounded,
                    isValid ? '' : 'ring-amber-600 focus-within:ring-amber-600',
                    'relative flex flex-row items-center justify-evenly'
                )}
                style={getBackgroundStyle()}
            >
                {options?.map((option, idx) => (
                    <li
                        key={option.value}
                        className={cn(
                            'z-10 text-center flex-1 transition-colors duration-[500ms] cursor-pointer select-none',
                            option.value === inputValue ? 'font-semibold' : '',
                            colorScheme === 'tricolor-blue' && idx === 2 && 'text-white',
                            colorScheme === 'tricolor-red' && idx !== 0 && 'text-white',
                        )}
                        onClick={() => handleChange(option.value)}
                    >
                        {option.text}
                    </li>
                ))}
                <div
                    className={cn(
                        'absolute z-0 transition-transform duration-300 ease-in-out inset-[2px] shadow',
                        typeof pillClass === 'string' && pillClass,
                        pillClass instanceof Function && pillClass(inputValue),
                        colorScheme ? getPillColor(inputValue || '') : 'bg-white',
                        
                        rounded
                    )}
                    style={{
                        transform: pillTransform,
                        width: pillWidth,
                    }}
                ></div>
            </ul>
            <ValidationPrompt />
        </div>
    )
}
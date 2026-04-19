import { useParams } from 'react-router-dom'
import { FormWrapper } from '@/form-control'
import { SelectField, TextAreaField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { ConstraintRoles, IConstraint } from '@/MODELS/constraint.model'

const constraintRoleOptions = Object.entries(ConstraintRoles).map(([label, value]) => ({
    value,
    text: label,
}))

/**
 * Form component for creating or editing a Constraint
 *
 * @param props Optional ID if not using route params
 */
export default function ConstraintForm(props: { id?: string }) {
    const params = useParams()
    const id = params.id ?? props.id ?? null

    return (
        <>
            <FormWrapper<IConstraint>
                endpoint={ROUTES.admin.constraint}
                id={id ?? 'new'}
                redirectAfterSubmit
                displayAs='standalone-card'
                noPopulate={['category']}
            >
                {(f) => (
                    <>
                        <div className='flex flex-col gap-y-6'>
                            <section>
                                <h2 className='mb-3 text-xl'>Basic Information</h2>
                                <div className='grid sm:grid-cols-2 gap-x-5 gap-y-4'>
                                    <SelectField
                                        {...f('category')}
                                        placeholder='Category'
                                        optionsListConfig={{
                                            endpoint: ROUTES.admin.category,
                                            textKey: 'name',
                                            valueKey: '_id',
                                        }}
                                        containerClass='col-span-2'
                                    />
                                    <TextField
                                        {...f('title')}
                                        label='Constraint Title'
                                        placeholder='Enter a descriptive title'
                                    />
                                    <TextField {...f('type')} label='Constraint Type' />
                                    <div className='sm:col-span-2'>
                                        <TextAreaField
                                            {...f('description')}
                                            label='Description'
                                            placeholder='Provide a detailed description of this constraint'
                                            rows={4}
                                        />
                                    </div>
                                    <TextField
                                        {...f('affordanceTagGroup')}
                                        label='Affordance Tag Group'
                                        placeholder='Related affordance tags'
                                    />
                                    <SelectField
                                        {...f('constraintRole')}
                                        label='Constraint Role'
                                        options={constraintRoleOptions}
                                        placeholder='Select foundation, shaping, or consequence'
                                    />
                                </div>
                            </section>

                            <section>
                                <h2 className='mb-3 text-xl'>Additional Details</h2>
                                <div className='grid sm:grid-cols-1 gap-y-4'>
                                    <TextAreaField
                                        {...f('notes')}
                                        label='Notes'
                                        placeholder='Any additional notes about this constraint'
                                        rows={3}
                                    />
                                    <TextAreaField
                                        {...f('contextualAudit')}
                                        label='Contextual Audit'
                                        placeholder='Details about contextual auditing for this constraint'
                                        rows={3}
                                    />
                                    <TextAreaField
                                        {...f('suggestedConstraintPrompt')}
                                        label='Suggested Constraint Prompt'
                                        placeholder='Enter a suggested prompt related to this constraint'
                                        rows={3}
                                    />
                                    <TextAreaField
                                        {...f('gameTemplateAnchor')}
                                        label='Suggested Constraint Prompt'
                                        placeholder='Enter a game template anchor for this affordance'
                                        rows={3}
                                    />
                                    <TextAreaField
                                        {...f('designIntent')}
                                        placeholder='Enter a design intent for this affordance'
                                        rows={3}
                                    />
                                    <TextField
                                        {...f('constraintArchetype')}
                                        label='Archetype Hint'
                                        placeholder='Enter the preferred archetype id or name'
                                    />
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </FormWrapper>
        </>
    )
}

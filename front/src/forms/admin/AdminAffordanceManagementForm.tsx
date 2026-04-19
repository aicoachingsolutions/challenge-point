import { useParams } from 'react-router'
import { FormWrapper } from '@/form-control'
import { SelectField, TextAreaField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { IAffordance } from '@/MODELS/affordance.model'

export default function AdminAffordanceForm(props: { id?: string }) {
    const params = useParams()
    const id = props?.id ?? params?.id ?? 'new'

    return (
        <FormWrapper<IAffordance>
            displayAs='standalone-card'
            endpoint={ROUTES.admin.affordance}
            id={id ?? 'new'}
            redirectAfterSubmit
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
                                    label='Affordance Title'
                                    placeholder='Enter a descriptive title'
                                />
                                <TextField {...f('type')} label='Afforance Type' />
                                <div className='sm:col-span-2'>
                                    <TextAreaField
                                        {...f('description')}
                                        label='Description'
                                        placeholder='Provide a detailed description of this affordance'
                                        rows={4}
                                    />
                                </div>
                                <TextField
                                    {...f('affordanceTagGroup')}
                                    label='Affordance Tag Group'
                                    placeholder='Related affordance tags'
                                />
                            </div>
                        </section>

                        <section>
                            <h2 className='mb-3 text-xl'>Additional Details</h2>
                            <div className='grid sm:grid-cols-1 gap-y-4'>
                                <TextAreaField
                                    {...f('notes')}
                                    label='Notes'
                                    placeholder='Any additional notes about this affordance'
                                    rows={3}
                                />
                                <TextAreaField
                                    {...f('contextualAudit')}
                                    label='Contextual Audit'
                                    placeholder='Details about contextual auditing for this affordance'
                                    rows={3}
                                />
                                <TextAreaField
                                    {...f('suggestedConstraintPrompt')}
                                    label='Suggested Constraint Prompt'
                                    placeholder='Enter a suggested prompt related to this affordance'
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
                            </div>
                        </section>
                    </div>
                </>
            )}
        </FormWrapper>
    )
}

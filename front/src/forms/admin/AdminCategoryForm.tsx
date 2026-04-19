import { useParams } from 'react-router'
import { FormWrapper } from '@/form-control'
import { TextAreaField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { ICategory } from '@/MODELS/category.model'

export default function AdminCategoryForm(props: { id?: string }) {
    const params = useParams()
    const id = props?.id ?? params?.id ?? 'new'

    return (
        <FormWrapper<ICategory>
            displayAs='standalone-card'
            endpoint={ROUTES.admin.category}
            id={id ?? 'new'}
            redirectAfterSubmit
        >
            {(f) => (
                <>
                    <div className='flex flex-col gap-y-3'>
                        <TextField {...f('name')} required placeholder='Enter category name' />
                        <TextAreaField
                            rows={4}
                            {...f('description')}
                            placeholder='Enter a description for the category'
                        />
                    </div>
                </>
            )}
        </FormWrapper>
    )
}

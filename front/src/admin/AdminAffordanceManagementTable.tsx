import { PencilIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ROUTES from '@/ROUTES'
import { format } from 'date-fns'

import { IAffordance } from '@/MODELS/affordance.model'

import { api } from '@/services/api.service'
import { useResource } from '@/services/resource.service'

import Button from '@/components/Button'
import ConfirmModal from '@/components/ConfirmModal'
import Table from '@/components/Table'

export default function AdminAffordanceManagementTable() {
    const navigate = useNavigate()
    const [data, setData, dataResource] = useResource<IAffordance[]>(ROUTES.admin.affordance)
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

    const generateCategoryForAffordance = (affordanceId: string) => {
        api(`${ROUTES.admin.affordance}/${affordanceId}/generate-category`).then((res) => dataResource.get())
    }

    return (
        <div className='flex flex-col w-full gap-5 py-10 mx-auto max-w-7xl'>
            <header className='flex flex-row items-center justify-between'>
                <h1 className='text-4xl font-semibold'>Affordances</h1>
                <Button onClick={() => navigate(`/admin/manage-affordance/new`)}>Add New Item</Button>
            </header>
            <Table
                            data={data ?? []}
                            columns={[
                                {
                                    header: 'Title',
                                    cell: (x) => x.title,
                                },
                                {
                                    header: 'Description',
                                    cell: (x) => `${x.description?.substring(0, 40)}...`,
                                },
                                {
                                    header: 'Affordance Tag Group',
                                    cell: (x) => x.affordanceTagGroup,
                                },
                                {
                                    header: 'Category',
                                    cell: (x) =>
                                        x.category ? (
                                            x.category.name
                                        ) : (
                                            <Button
                                                //@ts-ignore works fine
                                                onClickAsync={(e) => {
                                                    e.stopPropagation()
                                                    generateCategoryForAffordance(x._id)
                                                }}
                                            >
                                                Generate Category
                                            </Button>
                                        ),
                                },
                                {
                                    header: '',
                                    cell: (metric) => (
                                        <Button.Trash
                                            onClick={(e) => {
                                                e?.stopPropagation()
                                                setDeleteItemId(metric._id)
                                            }}
                                        />
                                    ),
                                },
                            ]}
                            exportColumns={[
                                'title',
                                'description',
                                'type',
                                'affordanceTagGroup',
                                'notes',
                                'contextualAudit',
                                'suggestedConstraintPrompt',
                                'category',
                                'gameTemplateAnchor',
                                'designIntent',
                                'constraintArchetype'
                            ]}
                            exportData={(datum) =>
                                datum.map((d) => ({
                                    title: d.title,
                                    description: d.description,
                                    type: d.type,
                                    affordanceTagGroup: d.affordanceTagGroup,
                                    notes: d.notes,
                                    contextualAudit: d.contextualAudit,
                                    suggestedConstraintPrompt: d.suggestedConstraintPrompt,
                                    category: d.category.name,
                                    gameTemplateAnchor: d.gameTemplateAnchor,
                                designIntent: d.designIntent,
                                constraintArchetype: d.constraintArchetype
                                }))
                            }
                            onRowClick={(metric) => navigate(`/admin/manage-affordance/${metric._id}`)}
                        />
            <ConfirmModal
                open={!!deleteItemId}
                onCancel={() => setDeleteItemId(null)}
                onConfirm={async () => {
                    await dataResource.deleteById(deleteItemId)
                    await dataResource.get()
                    setDeleteItemId(null)
                }}
                title='Delete Item'
                description='Are you sure you want to delete this item? This action cannot be undone.'
                confirmText='Delete'
                cancelText='Cancel'
                intent='danger'
            />

        </div>
    )
}

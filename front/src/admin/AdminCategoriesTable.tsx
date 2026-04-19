import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ROUTES from '@/ROUTES'
import { format } from 'date-fns'

import { IAffordance } from '@/MODELS/affordance.model'
import { ICategory } from '@/MODELS/category.model'

import { useResource } from '@/services/resource.service'
import { determineZpdZone, getZoneInfo } from '@/utils/analysis'

import Button from '@/components/Button'
import ConfirmModal from '@/components/ConfirmModal'
import Table from '@/components/Table'

export default function AdminCategoriesTable() {
    const navigate = useNavigate()
    const [data, setData, dataResource] = useResource<ICategory[]>(ROUTES.admin.category)
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

    return (
        <div className='flex flex-col w-full gap-5 py-10 mx-auto max-w-7xl'>
            <header className='flex flex-row items-center justify-between'>
                <h1 className='text-4xl font-semibold'>Categories</h1>
                <Button onClick={() => navigate(`/admin/manage-category/new`)}>Add New Item</Button>
            </header>
            <Table
            
                data={data ?? []}
                columns={[
                    {
                        header: 'Name',
                        cell: (x) => x.name,
                    },
                    {
                        header: 'Description',
                        cell: (x) => <p className='truncate'>{x.description.length > 120 ? `${x.description.substring(0,120)}...` : x.description}</p>,
                    },
                ]}
                onRowClick={(metric) => navigate(`/admin/manage-category/${metric._id}`)}
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

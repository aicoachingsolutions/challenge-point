
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ROUTES from '@/ROUTES'
import { format } from 'date-fns'



import { useResource } from '@/services/resource.service'

import Button from '@/components/Button'
import ConfirmModal from '@/components/ConfirmModal'
import Table from '@/components/Table'
import { IAffordance } from '@/MODELS/affordance.model'
import { IActivity } from '@/MODELS/activity.model'
import { determineZpdZone, getZoneInfo } from '@/utils/analysis'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid'

export default function AdminActivitiesTable() {
    const navigate = useNavigate()
    const [data, setData, dataResource] = useResource<IActivity[]>(ROUTES.admin.activity)
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

    return (
        <div className='flex flex-col w-full gap-5 py-10 mx-auto max-w-7xl'>
            <header className='flex flex-row items-center justify-between'>
                <h1 className='text-4xl font-semibold'>Activities</h1>
                <Button onClick={() => navigate(`/admin/manage-activity/new`)}>Add New Item</Button>
            </header>
                <Table
                    data={data ?? []}
                    columns={[
                        {
                            header: 'Created by',
                            cell: (x) => `${x.session.createdBy.firstName} ${x.session.createdBy.lastName}`,
                        },
                        {
                            header: 'Status',
                            cell: (x) => x.activityStatus,
                        },
                        {
                            header: 'Title',
                            cell: (x) => x.title ?? 'N/A',
                        },
                        
                        {
                            header: 'In Optimal Learning Zone?', 
                            cell: (x) => getZoneInfo(determineZpdZone(x.difficultyLevel, x.engagementLevel)).inZpd ? <CheckCircleIcon className='w-5 text-green-500'/> : <XCircleIcon className='w-5 text-red-600'/>
                        },
                        {
                            header: 'Affordances',
                            cell: (x) => x.affordancesUsed?.map((a) => a.title).join(', '),
                        },
                        {
                            header: 'Constraints',
                            cell: (x) => x.constraintsUsed?.map((a) => a.title).join(', '),
                        },
                       
                        // {header: 'Breakthroughs',
                        //     cell: (x) => FILTER ACTIVITIES TO FIND BREAKTHROUGHS
                        // }
                    ]}
                    onRowClick={(metric) => navigate(`/admin/manage-activity/${metric._id}`)}
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
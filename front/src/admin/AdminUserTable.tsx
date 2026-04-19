import { PencilIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ROUTES from '@/ROUTES'
import { format } from 'date-fns'

import { IUser } from '@/MODELS/user.model'

import { useResource } from '@/services/resource.service'

import Avatar from '@/components/Avatar'
import Button from '@/components/Button'
import ConfirmModal from '@/components/ConfirmModal'
import Table from '@/components/Table'

export default function AdminUserTable() {
    const navigate = useNavigate()
    const [data, setData, UserResource] = useResource<IUser[]>(ROUTES.admin.user)
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

    return (
        <div className='flex flex-col w-full gap-5 py-10 mx-auto max-w-7xl'>
            <header className='flex flex-row items-center justify-between'>
                <h1 className='text-4xl font-semibold'>Manage Coach Accounts</h1>
            </header>
            <Table
                data={data ?? []}
                columns={[
                    {
                        header: '',
                        cell: (user) => <Avatar user={user} size='sm' />,
                    },
                    {
                        header: 'Name',
                        cell: (user) => `${user.firstName} ${user.lastName}`,
                    },
                    {
                        header: 'Email',
                        cell: 'email',
                    },
                    {
                        header: 'Access Level',
                        cell: (user) => (user.permissions?.isAdmin ? 'Admin' : 'User'),
                        filter: [
                            { label: 'Admin', fn: (user) => user.permissions?.isAdmin },
                            { label: 'User', fn: (user) => !user.permissions?.isAdmin },
                        ],
                    },
                    {
                        header: 'Created At',
                        cell: (user) => format(new Date(user.createdAt), 'PPPp'),
                        sort: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                    },
                    {
                        header: '',
                        cell: (user) => (
                            <Link
                                to={`/admin/user/${user._id}/edit`}
                                className='transition-opacity hover:opacity-70'
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                <PencilIcon className='w-6 h-6 shrink-0' />
                            </Link>
                        ),
                    },
                    {
                        header: '',
                        cell: (user) => (
                            <Button.Trash
                                onClick={(e) => {
                                    e?.stopPropagation()
                                    setDeleteUserId(user._id)
                                }}
                            />
                        ),
                    },
                ]}
                onRowClick={(user) => navigate(`manage-user/${user._id}`)}
            />
            <ConfirmModal
                open={!!deleteUserId}
                onCancel={() => setDeleteUserId(null)}
                onConfirm={async () => {
                    await UserResource.deleteById(deleteUserId)
                    await UserResource.get()
                    setDeleteUserId(null)
                }}
                title='Delete User'
                description='Are you sure you want to delete this user? This action cannot be undone.'
                confirmText='Delete'
                cancelText='Cancel'
                intent='danger'
            />
        </div>
    )
}
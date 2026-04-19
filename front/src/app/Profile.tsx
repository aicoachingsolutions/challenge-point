import { Link, useNavigate } from 'react-router-dom'
import ROUTES from '@/ROUTES'

import { IUser } from '@/MODELS/user.model'

import { useAuth } from '@/services/authentication.service'
import { useResource } from '@/services/resource.service'

import { JSONView } from '@/utils/scary-utils'

import Avatar from '@/components/Avatar'
import Button from '@/components/Button'
import Empty from '@/components/Empty'
import Loading from '@/components/Loading'

export default function ProfilePage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [userData, setUserData, userResource] = useResource<IUser[]>(ROUTES.app.user)

    return (
        <div className='flex flex-col w-full py-10 mx-auto max-w-7xl gap-y-10'>
            <header>
                <h1>Profile</h1>
                <Loading isLoading={userResource.isLoading} />
            </header>
            {user && (
                <div className='flex flex-col items-center gap-y-5'>
                    <Avatar size='lg' className='border-4 border-brand-500' />
                    <h2 className='text-2xl'>{user.firstName} {user.lastName}</h2>
                    <p className='text-lg text-gray-600'>{user.email}</p>
                    <Button.Secondary onClick={() => navigate(`/edit-profile/${user._id}`)}>Edit Profile</Button.Secondary>
                </div>
            )}
            <section>
                <h2>Coach Metrics</h2>
                {userData === null && <Empty text='No data available' />}
                {userData !== null && (
                    <div className='flex flex-col gap-y-5'>
                        {userData.map((profileData) => (
                            <div key={profileData._id} className='p-5 bg-white border rounded-lg shadow-sm'>
                                <JSONView obj={profileData} />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
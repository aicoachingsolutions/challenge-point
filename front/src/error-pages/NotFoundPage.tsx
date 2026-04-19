import { useNavigate } from 'react-router'

import Button from '@/components/Button'

import logo from '../../logo.png'

export default function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div className='flex flex-col items-center justify-center w-screen h-screen '>
            <img src={logo} className='w-auto h-32' />
            <h1 className='mt-12 heading text-neutral-700'>Page Not Found</h1>
            <Button.Outline onClick={() => navigate('/')} className='mt-6'>
                Go back
            </Button.Outline>
        </div>
    )
}

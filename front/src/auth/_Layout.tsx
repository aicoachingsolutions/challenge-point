import ErrorBoundary from '@/components/ErrorBoundary'

import logo from '../../logo.png'

export default function AuthLayout({ info, children }: { info: React.ReactNode; children: React.ReactNode }) {
    return (
        <main className='flex h-[100dvh] bg-white'>
            <aside className='flex-1 hidden max-w-2xl sm:flex bg-brand-300'>
                <div className='m-auto'>
                    <img src={logo} className='w-64' />
                    {info}
                </div>
            </aside>
            <div className='flex flex-col items-center flex-1 w-full m-2 mx-auto sm:max-w-3xl'>
                <div className='w-full px-6 my-auto sm:max-w-xl'>
                    <img src={logo} className='mx-auto mb-6 h-28 sm:hidden' />
                    <ErrorBoundary componentName='Auth'>{children}</ErrorBoundary>
                </div>
            </div>
        </main>
    )
}

import { useNavigate } from 'react-router'
import { useScrolled } from '@/hooks'

import { useAuth } from '@/services/authentication.service'
import { cn } from '@/utils/cn'

import Avatar from '@/components/Avatar'
import Button from '@/components/Button'

import { AppLink, INavLink, SecondaryLink } from '../Links'

export function ColumnHeader(props: {
    primaryLinks?: INavLink[]
    secondaryLinks?: INavLink[]
    //
    logo?: string
}) {
    const navigate = useNavigate()
    const hasScrolled = useScrolled()
    const { user } = useAuth()

    return (
        <header
            className={cn(
                'z-30 sticky top-0 left-0 right-0 w-full select-none transition-all bg-white border-b border-gray-100 hidden sm:flex',
                hasScrolled ? 'shadow-lg h-16 bg-white/95 backdrop-blur-sm' : 'h-20 shadow-sm'
            )}
        >
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 lg:px-8">
                {/* Brand Section */}
                <div className="flex items-center">
                    <a href='/' className='flex items-center group'>
                        {props?.logo ? (
                            <img
                                src={props.logo}
                                className={cn('w-auto transition-all duration-300 group-hover:scale-105', hasScrolled ? 'h-12' : 'h-16')}
                                alt={import.meta.env.VITE_PROJECT_NAME}
                            />
                        ) : (
                            <h1 className='text-2xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors'>
                                {import.meta.env.VITE_PROJECT_NAME}
                            </h1>
                        )}
                    </a>
                </div>

                {/* Navigation Section */}
                <nav className='flex items-center space-x-8'>
                    {/* Primary Links */}
                    <ul className='flex items-center space-x-6'>
                        {props.primaryLinks?.filter(link => link.text !== 'Profile').map((link, index) => (
                            <li key={index}>
                                <AppLink {...link} />
                            </li>
                        ))}
                    </ul>

                    {/* User Section */}
                    <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
                        {!user ? (
                            <div className="flex items-center space-x-3">
                                <Button.Secondary
                                    className='px-4 py-2 text-sm font-medium'
                                    onClick={() => navigate('/login')}
                                >
                                    Sign In
                                </Button.Secondary>
                                <Button
                                    className='px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white'
                                    onClick={() => navigate('/register')}
                                >
                                    Get Started
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                {props.secondaryLinks?.map((link, index) => (
                                    <SecondaryLink key={index} {...link} />
                                ))}
                                <button 
                                    className='p-1 rounded-full hover:bg-gray-100 transition-colors'
                                    onClick={() => navigate('/profile')}
                                >
                                    <Avatar size='md' />
                                </button>
                            </div>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    )
}

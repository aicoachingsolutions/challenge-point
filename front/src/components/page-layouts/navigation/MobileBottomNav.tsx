import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { INavLink } from '../Links'

export function MobileBottomNav(props: {
    primaryLinks?: INavLink[]
}) {
    const location = useLocation()

    const links = props.primaryLinks?.filter(link => link.text !== 'separator' && link.href)
    .slice(0, 4) // limit to 4 items max
    
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 sm:hidden">
            <div className="flex justify-around items-center h-16 max-w-screen-sm mx-auto">
                {links?.map((link, index) => {
                    const isActive = location.pathname === link.href;
                    return (
                        <Link
                            key={index}
                            to={link.href || '/'}
                            className={cn(
                                "flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-all duration-200",
                                isActive
                                    ? 'text-brand-600' 
                                    : 'text-gray-500 hover:text-brand-500'
                            )}
                        >
                            {link.icon && (
                                <div className={cn(
                                    "p-1 rounded-lg transition-all duration-200",
                                    isActive
                                        ? 'bg-brand-50 text-brand-600' 
                                        : 'text-gray-500'
                                )}>
                                    <link.icon className="w-5 h-5" />
                                </div>
                            )}
                            <span className={cn(
                                'text-xs font-medium mt-1 truncate',
                                isActive 
                                    ? 'text-brand-600 font-semibold' 
                                    : 'text-gray-500'
                            )}>
                                {link.text}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    )
} 
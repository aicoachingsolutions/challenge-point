import { HomeIcon, Square3Stack3DIcon, WrenchScrewdriverIcon, UserIcon } from '@heroicons/react/24/outline'
import { Outlet } from 'react-router-dom'

import { useAuth } from '@/services/authentication.service'

import ErrorBoundary from '@/components/ErrorBoundary'
import Layout from '@/components/page-layouts/Layout'
import { INavLink } from '@/components/page-layouts/Links'

import logo from '../../logo-long.png'

const PUBLIC_LINKS: INavLink[] = []
const APPLICATION_LINKS: INavLink[] = [
    { text: 'Home', href: '/', icon: HomeIcon },
    { text: 'Session Library', href: '/session-library', icon: Square3Stack3DIcon },
    { text: 'Profile', href: '/profile', icon: UserIcon }
]
const ACCOUNT_LINKS: INavLink[] = [] 
const ADMIN_LINKS: INavLink[] = [{ text: 'Admin', href: '/admin', icon: WrenchScrewdriverIcon }]
const FOOTER_LINKS = [
    { text: 'Home', href: '/' },
    { text: 'Logout', href: '/logout' },
]

export default function AppLayout() {
    const { user } = useAuth()

    return (
        <Layout.Column
            logo={logo}
            primaryLinks={[
                ...(PUBLIC_LINKS.length ? PUBLIC_LINKS : []),
                ...APPLICATION_LINKS,
                ...(user?.permissions?.isAdmin ? ADMIN_LINKS : []),
            ]}
            secondaryLinks={user ? ACCOUNT_LINKS : []}
            footerLinks={FOOTER_LINKS}
        >
            <ErrorBoundary componentName='App'>
                <Outlet></Outlet>
            </ErrorBoundary>
        </Layout.Column>
    )
}

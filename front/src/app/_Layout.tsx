import { BeakerIcon, BugAntIcon, HomeIcon, Square3Stack3DIcon, WrenchScrewdriverIcon, UserIcon } from '@heroicons/react/24/outline'
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
    { text: 'Profile', href: '/profile', icon: UserIcon },
    // TEMPORARY developer/testing tool (Christian's debug system). Shown to all signed-in users
    // because the primary tester's account is not flagged admin and there's no in-app way to
    // promote it. Pre-field-test only — re-gate behind isAdmin (or remove) before broader release.
    { text: 'Selection Debug', href: '/debug', icon: BugAntIcon },
    // TEMPORARY developer/testing tool — canonical EM reasoning (Knowledge Core Package 1.1).
    { text: 'Knowledge Core', href: '/debug-em', icon: BeakerIcon },
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

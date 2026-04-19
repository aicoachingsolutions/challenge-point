import { SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { Outlet } from 'react-router-dom'

import ErrorBoundary from '@/components/ErrorBoundary'
import Layout from '@/components/page-layouts/Layout'
import { INavLink } from '@/components/page-layouts/Links'

import logo from '../../logo.png'

const ADMIN_LINKS: INavLink[] = [
    { text: 'Users', href: '/admin', icon: UserGroupIcon },
    { text: 'Activities', href: '/admin/activities', icon: UserGroupIcon },
    { text: 'Affordances', href: '/admin/affordances', icon: UserGroupIcon },
    { text: 'Constraints', href: '/admin/constraints', icon: UserGroupIcon },
    { text: 'Categories', href: '/admin/categories', icon: UserGroupIcon },
    {text: 'Activity Generation Prompt', href: '/admin/activity-generation-prompt', icon: SparklesIcon}]


const FOOTER_LINKS = [
    { text: 'Site Home', href: '/' },
    { text: 'Logout', href: '/logout' },
]

export default function AdminLayout() {
    return (
        <Layout.Admin
            logo={logo}
            primaryLinks={[...ADMIN_LINKS]}
            secondaryLinks={[]}
            footerLinks={FOOTER_LINKS}
            wideSidebarClassName=''
        >
            <ErrorBoundary componentName='App'>
                <Outlet></Outlet>
            </ErrorBoundary>
        </Layout.Admin>
    )
}


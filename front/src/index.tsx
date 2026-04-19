import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import AdminLibraryManagementTable from '@/admin/AdminAffordanceManagementTable'
import AdminUserTable from '@/admin/AdminUserTable'

import AdminLibraryManagementForm from '@/forms/admin/AdminAffordanceManagementForm'
import AdminUserForm from '@/forms/admin/AdminUserForm'
import ProfileForm from '@/forms/ProfileForm'

import Dashboard from '@/app/Dashboard'
import Profile from '@/app/Profile'

import 'regenerator-runtime'
import './index.css'

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AdminLayout from '@/admin/_Layout'
import AdminAffordanceManagementTable from '@/admin/AdminAffordanceManagementTable'
import LoginPage from '@/auth/LoginPage'
import LogoutPage from '@/auth/LogoutPage'
import RegisterPage from '@/auth/RegisterPage'
import RequestResetPage from '@/auth/RequestPasswordResetPage'
import ResetPasswordPage from '@/auth/ResetPasswordPage'
import ForbiddenPage from '@/error-pages/ForbiddenPage'
import NotFoundPage from '@/error-pages/NotFoundPage'

import {
    AuthenticatedWrapper,
    AuthProvider,
    OnboardingWrapper,
    PermissionsWrapper,
} from '@/services/authentication.service'
import { ResourceStatusProvider } from '@/services/resource.service'

import AdminAffordanceForm from '@/forms/admin/AdminAffordanceManagementForm'

import AppLayout from '@/app/_Layout'
import Onboarding from '@/app/Onboarding'

import ActivityGenerationPrompt from './admin/ActivityGenerationPrompt'
import AdminActivitiesTable from './admin/AdminActivitiesTable'
import AdminCategoriesTable from './admin/AdminCategoriesTable'
import AdminconstraintManagementTable from './admin/AdminConstraintManagementTable'
import ActivityGenerator from './app/ActivityGenerator'
import ActivityPage from './app/ActivityPage'
import SessionLibrary from './app/SessionLibrary'
import SessionPage from './app/SessionPage'
import AdminCategoryForm from './forms/admin/AdminCategoryForm'
import AdminConstraintForm from './forms/admin/AdminConstraintManagementForm'
import SessionForm from './forms/SessionForm'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <ScrollToTop />
            <ResourceStatusProvider>
                <AuthProvider>
                    <Routes>
                        {/* Authentication Pages */}
                        <Route path='/register' element={<RegisterPage />} />
                        <Route path='/login' element={<LoginPage />} />
                        <Route path='/logout' element={<LogoutPage />} />
                        <Route path='/request-reset' element={<RequestResetPage />} />
                        <Route path='/reset-password' element={<ResetPasswordPage />} />

                        {/* Public Routes */}
                        <Route path='/onboarding' element={<Onboarding />} />

                        <Route element={<AuthenticatedWrapper />}>
                            <Route element={<OnboardingWrapper />}>
                                <Route path='/' element={<AppLayout />}>
                                    <Route path='/' element={<Dashboard />} />
                                    <Route path='profile' element={<ProfileForm />} />
                                    <Route path='manage-session/:id' element={<SessionForm />} />
                                    <Route path='activity/:id' element={<ActivityPage />} />
                                    <Route path='session/:id' element={<SessionPage />} />
                                    <Route path='session/:id/activity-generator' element={<ActivityGenerator />} />
                                    <Route path='session-library' element={<SessionLibrary />} />
                                </Route>
                            </Route>
                            <Route element={<PermissionsWrapper required={{ isAdmin: true }} />}>
                                <Route path='/admin' element={<AdminLayout />}>
                                    <Route index element={<AdminUserTable />} />
                                    <Route path='activity-generation-prompt' element={<ActivityGenerationPrompt />} />
                                    <Route path='affordances' element={<AdminAffordanceManagementTable />} />
                                    <Route path='constraints' element={<AdminconstraintManagementTable />} />
                                    <Route path='activities' element={<AdminActivitiesTable />} />
                                    <Route path='categories' element={<AdminCategoriesTable />} />
                                    <Route path='manage-constraint/:id' element={<AdminConstraintForm />} />
                                    <Route path='manage-affordance/:id' element={<AdminAffordanceForm />} />
                                    <Route path='manage-category/:id' element={<AdminCategoryForm />} />
                                    <Route path='manage-user/:id' element={<AdminUserForm />} />
                                </Route>
                            </Route>
                        </Route>
                        {/* Error */}
                        <Route path='/forbidden' element={<ForbiddenPage />} />
                        <Route path='/*' element={<NotFoundPage />} />
                    </Routes>
                    <ToastContainer position='top-right' autoClose={5000} />
                </AuthProvider>
            </ResourceStatusProvider>
        </BrowserRouter>
    </React.StrictMode>
)


if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'
}

export default function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}


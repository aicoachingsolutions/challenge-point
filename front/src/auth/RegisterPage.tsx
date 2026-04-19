import { FormWrapper } from '@/form-control'
import { CheckboxField, PasswordField, SelectField, TextField } from '@/form-control/fields'
import ROUTES from '@/ROUTES'

import { AuthToken } from '@/MODELS/types'
import { EcologicalCoachingExperienceLevels } from '@/MODELS/user.model'

import { ApiResponse } from '@/services/api.service'
import { useAuth } from '@/services/authentication.service'

import AuthLayout from './_Layout'

interface IRegistrationForm {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    tos: boolean
    ecologicalCoachingExperienceLevel: EcologicalCoachingExperienceLevels
}

interface RegistrationResponse {
    token?: AuthToken
    confirmationRedirect?: string
    redirectUrl?: string
}

export default function RegisterPage() {
    const { fetchUser } = useAuth()

    return (
        <AuthLayout info={<></>}>
            <h1 className='mb-3 text-3xl font-medium text-center'>Create your account</h1>
            <h2 className='mb-5 text-center text-neutral-500'>
                Already have an account?{' '}
                <a className='text-brand-400 hover:text-brand-500' href='/login'>
                    Sign In
                </a>
            </h2>
            <FormWrapper<IRegistrationForm>
                endpoint={ROUTES.auth.register}
                id={null}
                isPublic
                preventInitialLoad
                callbackAfterSubmit={async ({ postResponse }: { postResponse?: ApiResponse<RegistrationResponse> }) => {
                    const { data, error } = postResponse
                    if (error) {
                        throw {
                            error,
                        }
                    }

                    if (!data?.token) {
                        throw {
                            error: 'Registration failed. Please check your details and try again.',
                        }
                    }

                    localStorage.setItem('token', JSON.stringify(data.token))
                    await fetchUser()

                    window.location.replace(data.redirectUrl ?? '/?newUser=true')
                }}
                submitButtonText='Register'
                submitButtonAlignment='center'
                validationMode='on-input'
                //
                validationRules={[
                    {
                        field: 'confirmPassword',
                        isValid: (fieldValue, formValues) => {
                            if (!fieldValue) {
                                return true
                            }
                            return fieldValue === formValues?.password
                        },
                        prompt: 'Passwords do not match',
                    },
                    {
                        field: 'email',
                        isValid: (fieldValue) => {
                            if (import.meta.env.MODE === 'development') {
                                return true
                            }
                            if (!fieldValue) {
                                return true
                            }
                            return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
                                fieldValue ?? ''
                            )
                        },
                        prompt: 'Invalid email address',
                    },
                    {
                        field: 'password',
                        isValid: (fieldValue) => {
                            if (import.meta.env.MODE === 'development') {
                                return true
                            }
                            if (!fieldValue) {
                                return true
                            }
                            return fieldValue?.length && fieldValue?.length >= 8
                        },
                        prompt: 'Passwords should be at least 8 characters',
                    },
                    {
                        field: 'password',
                        isValid: (fieldValue) => {
                            if (import.meta.env.MODE === 'development') {
                                return true
                            }
                            if (!fieldValue) {
                                return true
                            }
                            return /(?=.*[a-z])/.test(fieldValue ?? '')
                        },
                        prompt: 'Passwords should contain a lowercase letter',
                    },
                    {
                        field: 'password',
                        isValid: (fieldValue) => {
                            if (import.meta.env.MODE === 'development') {
                                return true
                            }
                            if (!fieldValue) {
                                return true
                            }
                            return /(?=.*[A-Z])/.test(fieldValue ?? '')
                        },
                        prompt: 'Passwords should contain an uppercase letter',
                    },
                    {
                        field: 'password',
                        isValid: (fieldValue) => {
                            if (import.meta.env.MODE === 'development') {
                                return true
                            }
                            if (!fieldValue) {
                                return true
                            }
                            return /(?=.*\d)/.test(fieldValue ?? '')
                        },
                        prompt: 'Passwords should contain a number',
                    },
                    {
                        field: 'password',
                        isValid: (fieldValue) => {
                            if (import.meta.env.MODE === 'development') {
                                return true
                            }
                            if (!fieldValue) {
                                return true
                            }
                            return /(?=.*\W)/.test(fieldValue ?? '')
                        },
                        prompt: 'Passwords should contain a special character',
                    },
                ]}
                errorMessages={{
                    400: 'Please check your details and try again.',
                    // 409 - set in response body
                    500: 'Failed to register, please retry or try refreshing the page.',
                }}
                //
                className='w-full'
            >
                {(f) => (
                    <>
                        <TextField required {...f('firstName')} autoComplete='given-name' name='firstName' />
                        <TextField required {...f('lastName')} autoComplete='family-name' name='lastName' />
                        <TextField required {...f('email')} autoComplete='email' type='email' name='email' />
                        <PasswordField required {...f('password')} autoComplete='new-password' name='new-password' />
                        <PasswordField
                            required
                            {...f('confirmPassword')}
                            autoComplete='new-password'
                            name='new-password'
                        />

                        <div className='flex flex-row items-center justify-center mt-5 gap-x-1'>
                            <CheckboxField
                                required
                                {...f('tos')}
                                label={false}
                                name='TermsOfService'
                                containerClass='w-fit'
                                inputClass='w-6 h-6'
                            />
                            <label htmlFor='TermsOfService' className='ml-2 text-neutral-500'>
                                I accept the platform{' '}
                                <a
                                    target='_blank'
                                    href='/terms-of-service'
                                    className='text-brand-400 hover:text-brand-500'
                                >
                                    Terms of Service
                                </a>
                            </label>
                        </div>
                    </>
                )}
            </FormWrapper>
        </AuthLayout>
    )
}


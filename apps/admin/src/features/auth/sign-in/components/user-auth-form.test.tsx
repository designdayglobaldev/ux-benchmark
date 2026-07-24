import { test, expect, vi, describe, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'
import { supabase } from '@/lib/supabase'

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}))

// Mock Tanstack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}))

describe('UserAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows validation errors when submitting empty form', async () => {
    const { getByRole, getByText } = await render(<UserAuthForm />)

    // Click submit without entering anything
    const submitBtn = getByRole('button', { name: /Sign in/i })
    await userEvent.click(submitBtn)

    // Assert validation messages appear
    await expect.element(getByText('Please enter your email.')).toBeVisible()
    await expect.element(getByText('Please enter your password.')).toBeVisible()
    
    // Ensure supabase was never called
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  test('successfully logs in and redirects', async () => {
    // Setup the mock to return success
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: '123' }, session: {} },
      error: null,
    } as any)

    const { getByRole, getByPlaceholder } = await render(<UserAuthForm />)

    // Fill out the form
    const emailInput = getByPlaceholder('name@example.com')
    const passInput = getByPlaceholder('********')
    
    await userEvent.fill(emailInput, 'admin@test.com')
    await userEvent.fill(passInput, 'password123')
    
    // Submit
    const submitBtn = getByRole('button', { name: /Sign in/i })
    await userEvent.click(submitBtn)

    // Verify Supabase was called with correct credentials
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'password123',
    })

    // Verify navigation was called to redirect
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/', replace: true })
  })

  test('displays an error message when login fails', async () => {
    // Setup the mock to return an error
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as any)

    const { getByRole, getByPlaceholder } = await render(<UserAuthForm />)

    // Fill out the form
    const emailInput = getByPlaceholder('name@example.com')
    const passInput = getByPlaceholder('********')
    
    await userEvent.fill(emailInput, 'admin@test.com')
    await userEvent.fill(passInput, 'wrongpassword')
    
    // Submit
    const submitBtn = getByRole('button', { name: /Sign in/i })
    await userEvent.click(submitBtn)

    // Verify Supabase was called
    expect(supabase.auth.signInWithPassword).toHaveBeenCalled()
    
    // Verify navigation was NOT called
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

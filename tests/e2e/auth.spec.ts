import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should redirect to login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/.*login/)
    await expect(page.getByText('Sign in to ScholarTrack')).toBeVisible()
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.getByPlaceholder('Email address')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    await page.getByText("Don't have an account? Sign up").click()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
    
    await page.getByText('Already have an account? Sign in').click()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Note: In a real test, you'd need to handle form validation
    // This is a basic structure for the test
  })
})

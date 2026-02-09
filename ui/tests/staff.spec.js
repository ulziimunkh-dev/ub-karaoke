import { test, expect } from '@playwright/test';

test.describe('Staff Flow', () => {
    test('should login as staff and view audit logs', async ({ page }) => {
        // 1. Navigate to Staff Login
        await page.goto('/staff/login');

        // 2. Perform Login
        // Note: Using default seed credentials or env variables
        await page.fill('input[name="orgCode"]', 'UBK');
        await page.fill('input[name="email"]', 'manager@ubk.mn');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 3. Verify Dashboard
        await expect(page).toHaveURL(/.*staff.*/);
        await expect(page.locator('h1')).toContainText(/Dashboard/i);

        // 4. Navigate to Audit Logs
        await page.click('a:has-text("Audit Logs")');
        await expect(page.locator('h2')).toContainText(/Audit Logs/i);

        // 5. Verify log presence
        await expect(page.locator('.p-datatable-tbody')).toBeVisible();
    });
});

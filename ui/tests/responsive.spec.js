import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone SE'] });

test.describe('Responsive Layout', () => {
    test('should have stacked buttons in Booking Modal on iPhone SE', async ({ page }) => {
        await page.goto('/');

        // 1. Open Booking Modal
        const venueCard = page.getByTestId('venue-card-clickable').first();
        await venueCard.click();

        // 2. Verify Modal Stacking classes
        const footer = page.locator('.booking-modal .flex-col-reverse').first();
        await expect(footer).toBeVisible();

        // 3. Verify buttons are full width on mobile
        const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
        const box = await cancelBtn.boundingBox();
        const viewport = page.viewportSize();

        // On mobile, the button should be roughly the width of the viewport (minus padding)
        expect(box.width).toBeGreaterThan(viewport.width * 0.8);
    });
});

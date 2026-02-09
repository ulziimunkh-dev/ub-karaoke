import { test, expect } from '@playwright/test';

test.describe('Booking Journey', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should complete a booking flow successfully', async ({ page }) => {
        // 1. Verify Homepage (using a more generic check)
        await expect(page).toHaveTitle(/UB Karaoke/i);

        // 2. Click on a Venue Card
        const venueCard = page.getByTestId('venue-card-clickable').first();
        await venueCard.click();

        // 3. Select a Room in the Booking Modal
        await expect(page.getByTestId('booking-modal')).toBeVisible();
        const roomItem = page.getByTestId('room-item').first();
        await roomItem.click();

        // 4. Confirm Selection
        await page.getByTestId('confirm-selection-button').click();

        // 5. Fill Booking Details & Proceed
        const proceedBtn = page.getByTestId('proceed-payment-button');
        await expect(proceedBtn).toBeVisible();
        await proceedBtn.click();

        // 6. Confirm Payment (Step 3)
        const confirmBtn = page.getByTestId('confirm-transfer-button');
        await expect(confirmBtn).toBeVisible();
        await confirmBtn.click();

        // 7. Verify Success (Step 4)
        await expect(page.getByTestId('booking-success-message')).toBeVisible();
    });
});

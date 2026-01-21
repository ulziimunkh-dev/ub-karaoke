import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingsCleanupService {
    private readonly logger = new Logger(BookingsCleanupService.name);

    constructor(private readonly bookingsService: BookingsService) { }

    /**
     * Run every minute to expire RESERVED bookings
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async handleExpiredReservations() {
        try {
            const count = await this.bookingsService.expireReservations();
            if (count > 0) {
                this.logger.log(`Auto-expired ${count} booking reservation(s)`);
            }
        } catch (error) {
            this.logger.error('Failed to expire bookings', error);
        }
    }

    /**
     * Send reservation expiry reminders (5 minutes before expiration)
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async sendExpirationReminders() {
        try {
            const count = await this.bookingsService.sendExpirationReminders();
            if (count > 0) {
                this.logger.log(`Sent ${count} expiration reminder(s)`);
            }
        } catch (error) {
            this.logger.error('Failed to send expiration reminders', error);
        }
    }
}

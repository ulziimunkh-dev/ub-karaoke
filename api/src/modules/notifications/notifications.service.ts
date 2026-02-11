import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
    ) { }

    private async logNotification(type: NotificationType, contact: string, message: string, userId?: number) {
        // Since this is mock, we don't always have userId directly from call args in current existing methods
        // But we should ideally pass it. For now, creating a record if we had more info.
        // Assuming we update calls or just log minimal info. 
        // Real implementation would look up user by phone/email or require userId.

        // For now, logging to DB is best effort if we don't have user ID in generic calls (mock)
        // Check if we can enhance existing methods
    }

    async create(data: Partial<Notification>) {
        const notification = this.notificationsRepository.create(data);
        return this.notificationsRepository.save(notification);
    }

    async sendVerificationCode(contact: string, code: string) {
        // Mock sending - Logger
        this.logger.log(`[MOCK EMAIL/SMS] To: ${contact} | Verification Code: ${code}`);
        console.log(`\n\n==================================================\n   VERIFICATION CODE for ${contact}: [ ${code} ]\n==================================================\n\n`);
    }

    async sendPasswordResetToken(contact: string, token: string) {
        // Mock sending - Logger
        this.logger.log(`[MOCK EMAIL/SMS] To: ${contact} | Reset Token: ${token}`);
        console.log(`\n\n==================================================\n   RESET TOKEN for ${contact}: [ ${token} ]\n==================================================\n\n`);
    }

    async sendLoginOtp(contact: string, otp: string) {
        this.logger.log(`[MOCK EMAIL/SMS] To: ${contact} | Login OTP: ${otp}`);
        console.log(`\n\n==================================================\n   LOGIN OTP for ${contact}: [ ${otp} ]\n==================================================\n\n`);

        // Try to verify if it's email or phone to guess type
        const type = contact.includes('@') ? NotificationType.EMAIL : NotificationType.SMS;

        // We could log this if we had a user attached. Since auth flow might be pre-login for OTP, 
        // logging it might be tricky without userId. 
        // For the purpose of this task, I'll allow creating explicit notifications via 'create' method
        // which can be called by other modules.
    }

    async sendBookingNotification(
        bookingId: string,
        type: 'created' | 'reserved' | 'approved' | 'rejected' | 'checked_in' | 'completed' | 'expired' | 'reminder',
        userId?: string,
        organizationId?: string
    ) {
        const titles = {
            created: 'Booking Created',
            reserved: 'Slot Reserved',
            approved: 'Booking Approved',
            rejected: 'Booking Rejected',
            checked_in: 'Checked In',
            completed: 'Booking Completed',
            expired: 'Reservation Expired',
            reminder: 'Payment Reminder'
        };

        const messages = {
            created: 'Your booking has been created and is pending approval',
            reserved: 'Your time slot has been reserved. Complete payment within 15 minutes.',
            approved: 'Your booking has been approved!',
            rejected: 'Your booking has been rejected',
            checked_in: 'You have been checked in. Enjoy your session!',
            completed: 'Your booking is complete. Thank you!',
            expired: 'Your booking reservation has expired',
            reminder: 'Your reservation expires soon. Complete payment now!'
        };

        const title = titles[type];
        const message = messages[type];

        if (userId) {
            // Create in-app notification for user
            await this.create({
                userId,
                bookingId,
                type: NotificationType.PUSH,
                status: NotificationStatus.SENT,
                title,
                message,
                organizationId
            });

            this.logger.log(`[NOTIFICATION] Booking ${type}: ${message} (User: ${userId})`);
        }
    }

    async getUserNotifications(userId: string, limit: number = 20) {
        return this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['booking']
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationsRepository.count({
            where: {
                userId,
                readAt: IsNull()
            }
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.notificationsRepository.findOne({
            where: { id: notificationId, userId }
        });

        if (notification && !notification.readAt) {
            notification.readAt = new Date();
            await this.notificationsRepository.save(notification);
        }

        return notification;
    }

    async markAllAsRead(userId: string) {
        await this.notificationsRepository.update(
            { userId, readAt: IsNull() },
            { readAt: new Date() }
        );
    }

    async deleteNotification(notificationId: string, userId: string) {
        await this.notificationsRepository.delete({ id: notificationId, userId });
    }
}

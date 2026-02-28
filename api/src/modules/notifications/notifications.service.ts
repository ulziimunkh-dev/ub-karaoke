import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { Staff, StaffRole } from '../staff/entities/staff.entity';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { OrganizationPayout } from '../organizations/entities/organization-payout.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    private configService: ConfigService,
    private appSettingsService: AppSettingsService,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    this.fromEmail =
      this.configService.get<string>('SMTP_FROM') || 'noreply@ubkaraoke.com';

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.logger.log(`SMTP configured: ${smtpHost}:${smtpPort}`);
    } else {
      this.logger.warn(
        'SMTP not configured — emails will only be logged to console',
      );
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (this.transporter && to.includes('@')) {
      try {
        await this.transporter.sendMail({
          from: `"UB Karaoke" <${this.fromEmail}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to}: ${subject}`);
      } catch (err) {
        this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      }
    }
    // Always log to console as backup
    console.log(
      `\n==================================================\n   [${subject}] To: ${to}\n==================================================\n`,
    );
  }

  private async logNotification(
    type: NotificationType,
    contact: string,
    message: string,
    userId?: number,
  ) {
    // Best-effort DB logging for mock
  }

  async create(data: Partial<Notification>) {
    const notification = this.notificationsRepository.create(data);
    return this.notificationsRepository.save(notification);
  }

  /**
   * Create an in-app notification for all staff and managers in an organization.
   * Called after key booking events so the bell shows actionable items for staff.
   */
  async sendOrgNotification(
    organizationId: string,
    title: string,
    message: string,
    bookingId?: string,
  ) {
    if (!organizationId) return;
    try {
      const staffMembers = await this.staffRepository.find({
        where: {
          organizationId,
          role: In([StaffRole.STAFF, StaffRole.MANAGER]),
        },
        select: ['id'],
      });

      if (staffMembers.length === 0) return;

      const rows = staffMembers.map((s) =>
        this.notificationsRepository.create({
          staffId: s.id,
          organizationId,
          bookingId: bookingId ?? undefined,
          type: NotificationType.PUSH,
          status: NotificationStatus.SENT,
          title,
          message,
        }),
      );

      await this.notificationsRepository.save(rows);
      this.logger.log(
        `[ORG NOTIFY] "${title}" sent to ${staffMembers.length} staff in org ${organizationId}`,
      );
    } catch (err) {
      this.logger.error(`Failed to send org notification: ${err.message}`);
    }
  }

  async sendVerificationCode(contact: string, code: string) {
    const subject = 'Your Verification Code';
    const html = `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#161622;border-radius:16px;color:#fff">
                <h2 style="margin:0 0 16px;color:#b000ff">UB Karaoke</h2>
                <p>Your verification code is:</p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#0a0a12;border-radius:12px;color:#eb79b2;margin:16px 0">${code}</div>
                <p style="color:#888;font-size:13px">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
        `;
    await this.sendEmail(contact, subject, html);
    // Also log to console for phone / non-email contacts
    if (!contact.includes('@')) {
      console.log(
        `\n==================================================\n   VERIFICATION CODE for ${contact}: [ ${code} ]\n==================================================\n`,
      );
    }
  }

  async notifyAdminsOfPayoutRequest(payout: OrganizationPayout) {
    try {
      // Get explicit emails from config
      const adminEmailsStr = await this.appSettingsService.getSetting('ADMIN_EMAILS');
      let emails: string[] = [];

      if (adminEmailsStr) {
        emails = adminEmailsStr.split(',').map(e => e.trim()).filter(e => !!e);
      } else {
        // Fallback to sysadmins from DB
        const sysadmins = await this.staffRepository.find({
          where: { role: StaffRole.SYSADMIN },
          select: ['email'],
        });
        emails = sysadmins.map(s => s.email).filter(e => !!e);
      }

      if (emails.length === 0) return;

      const subject = `[ACTION REQUIRED] New Payout Request - #${payout.id}`;
      const amount = new Intl.NumberFormat('mn-MN', { style: 'currency', currency: 'MNT' }).format(payout.totalAmount);
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#161622;border-radius:16px;color:#fff;border: 1px solid #b000ff33">
          <h2 style="margin:0 0 16px;color:#b000ff">Payout Management</h2>
          <p>A new payout request has been received and requires your attention.</p>
          <div style="background:#0a0a12;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #eb79b2">
            <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase">Request ID</p>
            <p style="margin:0 0 16px;font-size:18px;font-weight:bold">#P-${payout.id}</p>
            <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase">Amount</p>
            <p style="margin:0 0 16px;font-size:24px;font-weight:bold;color:#eb79b2">${amount}</p>
            <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase">Organization ID</p>
            <p style="margin:0;font-size:16px">${payout.organizationId}</p>
          </div>
          <p>Please log in to the admin dashboard to process this request.</p>
          <div style="text-align:center;margin-top:32px">
            <a href="${this.configService.get('FRONTEND_URL')}/sysadmin" style="background:#b000ff;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Go to Dashboard</a>
          </div>
        </div>
      `;

      for (const email of emails) {
        await this.sendEmail(email, subject, html);
      }
    } catch (err) {
      this.logger.error(`Failed to notify admins of payout: ${err.message}`);
    }
  }

  async sendPasswordResetToken(contact: string, token: string) {
    const subject = 'Password Reset';
    const html = `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#161622;border-radius:16px;color:#fff">
                <h2 style="margin:0 0 16px;color:#b000ff">UB Karaoke</h2>
                <p>Your password reset token is:</p>
                <div style="font-size:18px;font-weight:bold;text-align:center;padding:16px;background:#0a0a12;border-radius:12px;color:#eb79b2;margin:16px 0;word-break:break-all">${token}</div>
                <p style="color:#888;font-size:13px">If you did not request this, please ignore this email.</p>
            </div>
        `;
    await this.sendEmail(contact, subject, html);
    if (!contact.includes('@')) {
      console.log(
        `\n==================================================\n   RESET TOKEN for ${contact}: [ ${token} ]\n==================================================\n`,
      );
    }
  }

  async sendLoginOtp(contact: string, otp: string) {
    const subject = 'Your Login Code';
    const html = `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#161622;border-radius:16px;color:#fff">
                <h2 style="margin:0 0 16px;color:#b000ff">UB Karaoke</h2>
                <p>Your one-time login code is:</p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#0a0a12;border-radius:12px;color:#eb79b2;margin:16px 0">${otp}</div>
                <p style="color:#888;font-size:13px">This code expires in 5 minutes.</p>
            </div>
        `;
    await this.sendEmail(contact, subject, html);
    if (!contact.includes('@')) {
      console.log(
        `\n==================================================\n   LOGIN OTP for ${contact}: [ ${otp} ]\n==================================================\n`,
      );
    }

    // Try to verify if it's email or phone to guess type
    const type = contact.includes('@')
      ? NotificationType.EMAIL
      : NotificationType.SMS;

    // We could log this if we had a user attached. Since auth flow might be pre-login for OTP,
    // logging it might be tricky without userId.
    // For the purpose of this task, I'll allow creating explicit notifications via 'create' method
    // which can be called by other modules.
  }

  async sendBookingNotification(
    bookingId: string,
    type:
      | 'created'
      | 'reserved'
      | 'approved'
      | 'rejected'
      | 'checked_in'
      | 'completed'
      | 'expired'
      | 'reminder',
    userId?: string,
    organizationId?: string,
  ) {
    const titles = {
      created: 'Booking Created',
      reserved: 'Slot Reserved',
      approved: 'Booking Approved',
      rejected: 'Booking Rejected',
      checked_in: 'Checked In',
      completed: 'Booking Completed',
      expired: 'Reservation Expired',
      reminder: 'Payment Reminder',
    };

    const messages = {
      created: 'Your booking has been created and is pending approval',
      reserved:
        'Your time slot has been reserved. Complete payment within 15 minutes.',
      approved: 'Your booking has been approved!',
      rejected: 'Your booking has been rejected',
      checked_in: 'You have been checked in. Enjoy your session!',
      completed: 'Your booking is complete. Thank you!',
      expired: 'Your booking reservation has expired',
      reminder: 'Your reservation expires soon. Complete payment now!',
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
        organizationId,
      });

      this.logger.log(
        `[NOTIFICATION] Booking ${type}: ${message} (User: ${userId})`,
      );
    }
  }

  async getUserNotifications(
    where: { userId?: string; staffId?: string },
    limit: number = 20,
  ) {
    return this.notificationsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['booking'],
    });
  }

  async getUnreadCount(where: {
    userId?: string;
    staffId?: string;
  }): Promise<number> {
    return this.notificationsRepository.count({
      where: { ...where, readAt: IsNull() },
    });
  }

  async markAsRead(
    notificationId: string,
    where: { userId?: string; staffId?: string },
  ) {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, ...where },
    });

    if (notification && !notification.readAt) {
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(where: { userId?: string; staffId?: string }) {
    await this.notificationsRepository.update(
      { ...where, readAt: IsNull() },
      { readAt: new Date() },
    );
  }

  async deleteNotification(
    notificationId: string,
    where: { userId?: string; staffId?: string },
  ) {
    await this.notificationsRepository.delete({ id: notificationId, ...where });
  }
}

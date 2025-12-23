import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

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
    }
}

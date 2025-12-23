import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { NotificationsService } from '../notifications/notifications.service';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
        private notificationsService: NotificationsService,
        private auditService: AuditService,
    ) { }

    async signup(signupDto: SignupDto) {
        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({
            where: [{ email: signupDto.email }, { phone: signupDto.phone }],
        });

        if (existingUser) {
            throw new ConflictException('Email or Phone already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(signupDto.password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create user
        const user = this.usersRepository.create({
            ...signupDto,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            isVerified: false
        });

        const savedUser = await this.usersRepository.save(user);

        // Send OTP
        await this.notificationsService.sendVerificationCode(savedUser.email || savedUser.phone, verificationCode);

        // Log Audit
        await this.auditService.log({
            action: 'USER_REGISTERED',
            resource: 'User',
            resourceId: savedUser.id.toString(),
            userId: savedUser.id,
            details: { email: savedUser.email, phone: savedUser.phone }
        });

        // Return user without password
        const { password, ...result } = savedUser;
        return result; // No token yet, must verify
    }

    async verifyAccount(code: string) {
        const user = await this.usersRepository.findOne({ where: { verificationCode: code } });
        if (!user || !user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
            throw new UnauthorizedException('Invalid or expired verification code');
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await this.usersRepository.save(user);

        // Log Audit
        await this.auditService.log({
            action: 'ACCOUNT_VERIFIED',
            resource: 'User',
            resourceId: user.id.toString(),
            userId: user.id,
            details: { method: 'otp' }
        });

        return { message: 'Account verified successfully' };
    }

    async requestLoginOtp(identifier: string) {
        const user = await this.usersRepository.findOne({
            where: [{ email: identifier }, { username: identifier }, { phone: identifier }],
        });

        if (!user) throw new UnauthorizedException('User not found');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = otp;
        user.verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
        await this.usersRepository.save(user);

        await this.notificationsService.sendLoginOtp(identifier, otp);
        return { message: 'OTP sent' };
    }

    async loginWithOtp(identifier: string, code: string) {
        const user = await this.usersRepository.findOne({
            where: [{ email: identifier }, { username: identifier }, { phone: identifier }],
        });

        if (!user || user.verificationCode !== code || !user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // Clear OTP
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await this.usersRepository.save(user);

        if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

        // Log Audit
        await this.auditService.log({
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            userId: user.id,
            details: { method: 'otp', identifier }
        });

        const token = this.generateToken(user);
        const { password, ...result } = user;
        return { user: result, access_token: token };
    }

    async forgotPassword(email: string) {
        const user = await this.usersRepository.findOne({ where: { email } });
        if (!user) return { message: 'If email exists, reset link sent' }; // Security

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
        await this.usersRepository.save(user);

        await this.notificationsService.sendPasswordResetToken(email, token);

        await this.auditService.log({
            action: 'PASSWORD_RESET_REQUESTED',
            resource: 'User',
            userId: user.id,
            details: { email }
        });

        return { message: 'Reset link sent' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.usersRepository.findOne({ where: { resetToken: token } });
        if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpires = null;
        await this.usersRepository.save(user);

        await this.auditService.log({
            action: 'PASSWORD_RESET_SUCCESS',
            resource: 'User',
            userId: user.id,
            details: {}
        });

        return { message: 'Password reset successfully' };
    }

    async login(loginDto: LoginDto) {
        // Find user by email or username
        const user = await this.usersRepository.findOne({
            where: [
                { email: loginDto.identifier },
                { username: loginDto.identifier }
            ],
        });

        if (!user) {
            throw new UnauthorizedException('Invalids credentials');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid fcredentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Generate token
        const token = this.generateToken(user);

        // Log Audit
        await this.auditService.log({
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            userId: user.id,
            details: { method: 'password', identifier: loginDto.identifier }
        });

        // Return user without password
        const { password, ...result } = user;
        return {
            user: result,
            access_token: token,
        };
    }

    async validateUser(userId: number): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }

    private generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }

    async findById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }
}

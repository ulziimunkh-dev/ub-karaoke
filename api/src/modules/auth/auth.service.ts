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
import { Staff } from '../staff/entities/staff.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { NotificationsService } from '../notifications/notifications.service';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Staff)
        private staffRepository: Repository<Staff>,
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
        // Create user
        const user = this.usersRepository.create({
            ...signupDto,
            password: hashedPassword,
        });

        const savedUser = await this.usersRepository.save(user);

        // Send (mock) Verification
        // await this.notificationsService.sendVerificationCode(savedUser.email || savedUser.phone, verificationCode);

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

    // Account verification and OTP login temporarily disabled due to schema changes
    async verifyAccount(code: string) { return { message: 'Disabled' }; }
    async requestLoginOtp(identifier: string) { return { message: 'Disabled' }; }
    async loginWithOtp(identifier: string, code: string) { return { message: 'Disabled' }; }
    async forgotPassword(email: string) { return { message: 'Disabled' }; }
    async resetPassword(token: string, newPassword: string) { return { message: 'Disabled' }; }

    async login(loginDto: LoginDto) {
        const { identifier, password } = loginDto;

        // Try staff table first
        let user: any = await this.staffRepository.findOne({
            where: [
                { email: identifier },
                { username: identifier }
            ],
            relations: ['organization']
        });

        let userType = 'staff';

        // If not found in staff, try users (customers)
        if (!user) {
            user = await this.usersRepository.findOne({
                where: [
                    { email: identifier },
                    { username: identifier }
                ]
            });
            userType = 'customer';
        }

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Generate JWT
        const payload = {
            sub: user.id,
            email: user.email,
            role: userType === 'staff' ? user.role : 'customer',
            organizationId: user.organizationId,
            userType // 'staff' or 'customer'
        };

        const token = this.jwtService.sign(payload);

        // Log Audit
        await this.auditService.log({
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            userId: user.id,
            details: { method: 'password', identifier, userType }
        });

        // Return user without password
        const { password: _, ...result } = user;
        return {
            user: { ...result, userType },
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

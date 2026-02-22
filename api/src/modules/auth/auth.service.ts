import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { Staff } from '../staff/entities/staff.entity';
import { SignupDto } from './dto/signup.dto';
import { IsString, IsOptional } from 'class-validator';
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

        // Auto-derive name and username if not provided
        const identifier = signupDto.email || signupDto.phone || '';
        if (!signupDto.name) {
            signupDto.name = signupDto.email
                ? signupDto.email.split('@')[0]
                : signupDto.phone || 'User';
        }
        if (!signupDto.username) {
            const now = new Date();
            const dt = now.getFullYear().toString()
                + String(now.getMonth() + 1).padStart(2, '0')
                + String(now.getDate()).padStart(2, '0')
                + String(now.getHours()).padStart(2, '0')
                + String(now.getMinutes()).padStart(2, '0')
                + String(now.getSeconds()).padStart(2, '0');
            signupDto.username = 'userName' + dt;
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpiry = new Date();
        codeExpiry.setMinutes(codeExpiry.getMinutes() + 10);

        // Hash password
        const hashedPassword = await bcrypt.hash(signupDto.password, 10);
        // Create user
        const user = this.usersRepository.create({
            ...signupDto,
            password: hashedPassword,
            isVerified: false,
            verificationCode,
            verificationCodeExpiry: codeExpiry,
        });

        const savedUser = await this.usersRepository.save(user);

        // Update createdBy to the user's own ID
        savedUser.createdBy = savedUser.id;
        await this.usersRepository.save(savedUser);

        // Send verification code via email or console
        const contact = savedUser.email || savedUser.phone;
        if (contact) {
            await this.notificationsService.sendVerificationCode(contact, verificationCode);
        }

        // Log Audit
        await this.auditService.log({
            action: 'USER_REGISTERED',
            resource: 'User',
            resourceId: savedUser.id,
            actorId: savedUser.id,
            actorType: 'USER',
            details: { email: savedUser.email, phone: savedUser.phone }
        });

        // Return user without password or verification internals
        const { password, verificationCode: vc, ...result } = savedUser;
        return result; // No token yet, must verify
    }

    async verifyAccount(code: string) {
        const user = await this.usersRepository.findOne({
            where: { verificationCode: code },
        });

        if (!user) {
            throw new BadRequestException('Invalid verification code');
        }

        if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
            throw new BadRequestException('Verification code has expired. Please request a new one.');
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        await this.usersRepository.save(user);

        await this.auditService.log({
            action: 'ACCOUNT_VERIFIED',
            resource: 'User',
            resourceId: user.id,
            actorId: user.id,
            actorType: 'USER',
            details: { email: user.email, phone: user.phone }
        });

        return { message: 'Account verified successfully. You can now log in.' };
    }

    async resendVerificationCode(identifier: string) {
        const user = await this.usersRepository.findOne({
            where: [
                { email: identifier },
                { phone: identifier },
            ],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isVerified) {
            return { message: 'Account is already verified.' };
        }

        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpiry = new Date();
        codeExpiry.setMinutes(codeExpiry.getMinutes() + 10);

        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = codeExpiry;
        await this.usersRepository.save(user);

        const contact = user.email || user.phone;
        if (contact) {
            await this.notificationsService.sendVerificationCode(contact, verificationCode);
        }

        return { message: 'A new verification code has been sent.' };
    }

    // OTP login, forgot password, reset password — still disabled
    async requestLoginOtp(identifier: string) { return { message: 'Disabled' }; }
    async loginWithOtp(identifier: string, code: string) { return { message: 'Disabled' }; }
    async forgotPassword(email: string) { return { message: 'Disabled' }; }
    async resetPassword(token: string, newPassword: string) { return { message: 'Disabled' }; }

    async login(loginDto: LoginDto) {
        const { identifier, password, orgCode } = loginDto;
        let user: any;
        let userType: string;

        // STRICT SEPARATION
        if (orgCode) {
            // STAFF / MANAGER LOGIN
            // Must match Org Code + Username (Staff mostly use username)
            user = await this.staffRepository.findOne({
                where: {
                    username: identifier,
                    organization: { code: orgCode }
                },
                relations: ['organization']
            });
            userType = 'staff';
        } else {
            console.log(`[Auth] Attempting login for ${identifier} (No Org Code)`);

            // CUSTOMER LOGIN OR SYSADMIN LOGIN
            // 1. Try Customer (Users) — case-insensitive email
            const normalizedIdentifier = identifier.trim();
            user = await this.usersRepository
                .createQueryBuilder('user')
                .where('LOWER(user.email) = LOWER(:id)', { id: normalizedIdentifier })
                .orWhere('user.phone = :id', { id: normalizedIdentifier })
                .orWhere('user.username = :id', { id: normalizedIdentifier })
                .getOne();
            userType = 'customer';
            console.log(`[Auth] Found in Users?: ${!!user}`);

            // 2. If not found, try Sysadmin (Staff with no org or system role)
            if (!user) {
                console.log(`[Auth] Checking Staff repository for Sysadmin...`);
                // Sysadmins have no organizationId
                user = await this.staffRepository.findOne({
                    where: {
                        username: identifier,
                        organizationId: IsNull()
                    },
                    relations: ['organization']
                });
                console.log(`[Auth] Found in Staff (Sysadmin check)?: ${!!user}, Role: ${user?.role}`);

                // Only allow if role is sysadmin/admin, otherwise regular staff MUST use org code
                if (user && (user.role === 'sysadmin' || user.role === 'admin')) {
                    userType = 'staff';
                    console.log(`[Auth] Sysadmin/Admin identified`);
                } else if (user) {
                    // Found a staff but they tried to login without Org Code -> deny
                    console.log(`[Auth] Staff found but rejected (Org Code required)`);
                    user = null;
                }
            }
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

        // Note: Unverified customers are allowed to log in.
        // Verification is prompted in the user's profile.

        // Generate JWT
        const payload = {
            sub: user.id,
            email: user.email, // Staff might not have email? Entity says unique email.
            role: userType === 'staff' ? user.role : 'customer',
            organizationId: userType === 'staff' ? user.organization?.id : null,
            userType // 'staff' or 'customer'
        };

        const token = this.jwtService.sign(payload);

        // Log Audit
        await this.auditService.log({
            action: 'LOGIN_SUCCESS',
            resource: 'Auth',
            actorId: user.id,
            actorType: userType === 'staff' ? 'STAFF' : 'USER',
            details: { method: 'password', identifier, userType, orgCode }
        });

        // Return user without password
        const { password: _, ...result } = user;
        return {
            user: { ...result, userType },
            access_token: token,
        };
    }


    async validateUser(userId: string): Promise<User> {
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

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }
}

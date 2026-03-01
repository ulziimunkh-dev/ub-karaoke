import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
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
      const dt =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
      signupDto.username = 'userName' + dt;
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
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
      await this.notificationsService.sendVerificationCode(
        contact,
        verificationCode,
      );
    }

    // Log Audit
    await this.auditService.log({
      action: 'USER_REGISTERED',
      resource: 'User',
      resourceId: savedUser.id,
      actorId: savedUser.id,
      actorType: 'USER',
      details: { email: savedUser.email, phone: savedUser.phone },
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

    if (
      user.verificationCodeExpiry &&
      new Date() > user.verificationCodeExpiry
    ) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
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
      details: { email: user.email, phone: user.phone },
    });

    return { message: 'Account verified successfully. You can now log in.' };
  }

  private checkOtpCooldown(user: { lastOtpSentAt?: Date | null }): void {
    const COOLDOWN_SECONDS = 60;
    if (user.lastOtpSentAt) {
      const secondsElapsed = Math.floor(
        (Date.now() - new Date(user.lastOtpSentAt).getTime()) / 1000,
      );
      const remaining = COOLDOWN_SECONDS - secondsElapsed;
      if (remaining > 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Please wait ${remaining} seconds before requesting a new code.`,
            remainingSeconds: remaining,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  async resendVerificationCode(identifier: string) {
    const user = await this.usersRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Account is already verified.' };
    }

    this.checkOtpCooldown(user);

    // Generate new code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const codeExpiry = new Date();
    codeExpiry.setMinutes(codeExpiry.getMinutes() + 10);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiry = codeExpiry;
    user.lastOtpSentAt = new Date();
    await this.usersRepository.save(user);

    const contact = user.email || user.phone;
    if (contact) {
      await this.notificationsService.sendVerificationCode(
        contact,
        verificationCode,
      );
    }

    return { message: 'A new verification code has been sent.' };
  }

  // OTP login, forgot password, reset password
  async requestLoginOtp(identifier: string) {
    const user = await this.usersRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    this.checkOtpCooldown(user);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    user.otp = otp;
    user.otpExpiry = expiry;
    user.lastOtpSentAt = new Date();
    await this.usersRepository.save(user);

    const contact = user.email || user.phone;
    if (contact) {
      await this.notificationsService.sendLoginOtp(contact, otp);
    }

    return { message: 'OTP sent successfully' };
  }

  async loginWithOtp(identifier: string, code: string) {
    const user = await this.usersRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.otp !== code) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    await this.usersRepository.save(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: 'customer',
      organizationId: null,
      userType: 'customer',
    };

    const token = this.jwtService.sign(payload);

    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      resource: 'Auth',
      actorId: user.id,
      actorType: 'USER',
      details: { method: 'otp', identifier, userType: 'customer' },
    });

    const { password: _, otp: __, otpExpiry: ___, ...result } = user;
    return {
      user: { ...result, userType: 'customer' },
      access_token: token,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.checkOtpCooldown(user);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    user.lastOtpSentAt = new Date();
    await this.usersRepository.save(user);

    await this.notificationsService.sendPasswordResetToken(email, resetToken);

    return { message: 'Password reset token sent successfully' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersRepository.findOne({
      where: { resetToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.usersRepository.save(user);

    await this.auditService.log({
      action: 'PASSWORD_RESET',
      resource: 'User',
      resourceId: user.id,
      actorId: user.id,
      actorType: 'USER',
      details: { email: user.email },
    });

    return { message: 'Password reset successfully' };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password, orgCode } = loginDto;
    const normalizedIdentifier = identifier.trim();
    let user: any;
    let userType: string;

    // STRICT SEPARATION
    if (orgCode) {
      // STAFF / MANAGER LOGIN
      // Must match Org Code + Username/Email
      user = await this.staffRepository.findOne({
        where: [
          { username: normalizedIdentifier, organization: { code: orgCode } },
          { email: normalizedIdentifier, organization: { code: orgCode } },
        ],
        relations: ['organization'],
      });
      userType = 'staff';
    } else {
      console.log(
        `[Auth] Attempting login for ${normalizedIdentifier} (No Org Code)`,
      );

      // CUSTOMER LOGIN OR SYSADMIN LOGIN
      // 1. Try Customer (Users) — case-insensitive email
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
          where: [
            { username: normalizedIdentifier, organizationId: IsNull() },
            { email: normalizedIdentifier, organizationId: IsNull() },
          ],
          relations: ['organization'],
        });
        console.log(
          `[Auth] Found in Staff (Sysadmin check)?: ${!!user}, Role: ${user?.role}`,
        );

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
      userType, // 'staff' or 'customer'
    };

    const token = this.jwtService.sign(payload);

    // Log Audit
    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      resource: 'Auth',
      actorId: user.id,
      actorType: userType === 'staff' ? 'STAFF' : 'USER',
      details: { method: 'password', identifier, userType, orgCode },
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

import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('verify')
  async verify(@Body('code') code: string) {
    return this.authService.verifyAccount(code);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification code' })
  async resendVerification(@Body('identifier') identifier: string) {
    return this.authService.resendVerificationCode(identifier);
  }

  @Post('login-otp-request')
  async requestOtp(@Body('identifier') identifier: string) {
    return this.authService.requestLoginOtp(identifier);
  }

  @Post('login-otp')
  async loginOtp(
    @Body('identifier') identifier: string,
    @Body('code') code: string,
  ) {
    return this.authService.loginWithOtp(identifier, code);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    const { password, ...user } = req.user;
    return user;
  }
}

import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async signup(signupDto: SignupDto) {
        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({
            where: { email: signupDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(signupDto.password, 10);

        // Create user
        const user = this.usersRepository.create({
            ...signupDto,
            password: hashedPassword,
        });

        const savedUser = await this.usersRepository.save(user);

        // Generate token
        const token = this.generateToken(savedUser);

        // Return user without password
        const { password, ...result } = savedUser;
        return {
            user: result,
            access_token: token,
        };
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
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Generate token
        const token = this.generateToken(user);

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

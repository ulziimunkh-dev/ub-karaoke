import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Staff)
        private staffRepository: Repository<Staff>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        });
    }

    async validate(payload: any) {
        const { sub, userType, organizationId, role } = payload;

        let user;
        if (userType === 'staff') {
            user = await this.staffRepository.findOne({
                where: { id: sub },
                relations: ['organization']
            });
        } else {
            user = await this.usersRepository.findOne({
                where: { id: sub }
            });
        }

        if (!user || !user.isActive) {
            throw new UnauthorizedException();
        }

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            phone: user.phone,
            role,
            organizationId,
            userType,
            loyaltyPoints: (user as User).loyaltyPoints || 0,
            organization: userType === 'staff' ? (user as Staff).organization : null
        };
    }
}

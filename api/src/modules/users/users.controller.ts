import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users (admin only)' })
    async findAll() {
        const users = await this.usersRepository.find({
            select: ['id', 'email', 'username', 'name', 'phone', 'role', 'loyaltyPoints', 'isActive', 'createdAt'],
            order: { createdAt: 'DESC' }
        });
        return users;
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@Req() req: any, @Body() updateData: any) {
        const userId = req.user.id;

        // Only allow updating certain fields
        const allowedFields = ['name', 'email', 'phone'];
        const safeUpdates: any = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                safeUpdates[field] = updateData[field];
            }
        });

        await this.usersRepository.update(userId, safeUpdates);
        const updated = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'username', 'name', 'phone', 'role', 'loyaltyPoints', 'isActive', 'createdAt']
        });
        return updated;
    }
}

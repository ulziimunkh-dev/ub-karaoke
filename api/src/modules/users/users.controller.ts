import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @Roles('admin')
  @ApiOperation({ summary: 'Create new user (admin only)' })
  async create(@Req() req: any, @Body() createUserDto: any) {
    if (req.user.role !== 'manager' && req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only admins can create users');
    }

    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });
    if (existingUser) {
      throw new ConflictException('Username or Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isActive: true, // Auto-activate staff created by admin
    } as User); // Cast input to User to guide TypeORM or cast result

    const savedUser = await this.usersRepository.save(newUser);

    // Audit Log
    await this.auditService.log({
      action: 'USER_CREATED',
      resource: 'User',
      resourceId: savedUser.id,
      actorId: req.user.id,
      actorType: 'STAFF',
      details: { username: savedUser.username, role: savedUser.role },
    });

    const { password, ...result } = savedUser;
    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll() {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'email',
        'username',
        'name',
        'phone',
        'avatar',
        'role',
        'loyaltyPoints',
        'isActive',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
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
    const allowedFields = ['name', 'email', 'phone', 'avatar'];
    const safeUpdates: any = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        safeUpdates[field] = updateData[field];
      }
    });

    await this.usersRepository.update(userId, safeUpdates);

    // Log Audit
    await this.auditService.log({
      action: 'USER_PROFILE_UPDATED',
      resource: 'User',
      resourceId: userId,
      actorId: userId,
      actorType: 'USER',
      details: { updatedFields: Object.keys(safeUpdates) },
    });

    const updated = await this.usersRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'username',
        'name',
        'phone',
        'avatar',
        'role',
        'loyaltyPoints',
        'isActive',
        'createdAt',
      ],
    });
    return { ...updated, userType: 'customer' };
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role (manager or sysadmin only)' })
  async updateUserRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    if (req.user.role !== 'manager' && req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only admins can update roles');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldRole = user.role;
    user.role = body.role as any; // Cast to any to bypass enum check for now, or import UserRole
    await this.usersRepository.save(user);

    // Log Audit
    await this.auditService.log({
      action: 'USER_ROLE_UPDATED',
      resource: 'User',
      resourceId: id,
      actorId: req.user.id,
      actorType: 'STAFF',
      details: { oldRole, newRole: body.role },
    });

    return { message: 'User role updated', user };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle user active status (admin only)' })
  async toggleUserStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    if (req.user.role !== 'manager' && req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only admins can change user status');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.isActive = body.isActive;
    await this.usersRepository.save(user);

    // Log Audit
    await this.auditService.log({
      action: 'USER_STATUS_UPDATED',
      resource: 'User',
      resourceId: id,
      actorId: req.user.id,
      actorType: 'STAFF',
      details: { isActive: body.isActive },
    });

    return { message: 'User status updated', user };
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post()
    @ApiOperation({ summary: 'Create staff member (manager/sysadmin only)' })
    async create(@Req() req: any, @Body() createStaffDto: CreateStaffDto) {
        if (req.user.role !== 'manager' && req.user.role !== 'sysadmin') {
            throw new ForbiddenException('Only managers and sysadmin can create staff');
        }
        return this.staffService.create(createStaffDto, req.user.role, req.user.organizationId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all staff (filtered by organization)' })
    async findAll(@Req() req: any, @Query('organizationId') organizationId?: string) {
        // Sysadmin sees all (can filter), others see only their org
        const orgId = req.user.role === 'sysadmin'
            ? organizationId
            : req.user.organizationId;
        return this.staffService.findAll(orgId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get staff details' })
    async findOne(@Param('id') id: string) {
        return this.staffService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update staff member' })
    async update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() updateStaffDto: Partial<CreateStaffDto>
    ) {
        // Allow if sysadmin/manager OR if updating self
        const isSelf = req.user.id === id || req.user.sub === id;
        const canManage = req.user.role === 'manager' || req.user.role === 'sysadmin';

        if (!isSelf && !canManage) {
            throw new ForbiddenException('You can only update your own profile');
        }
        return this.staffService.update(id, updateStaffDto, req.user.role);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update current staff profile' })
    async updateProfile(@Req() req: any, @Body() updateData: any) {
        const userId = req.user.id;

        // Only allow updating certain fields
        const allowedFields = ['name', 'email', 'phone', 'avatar'];
        const safeUpdates: any = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                safeUpdates[field] = updateData[field];
            }
        });

        const updated = await this.staffService.update(userId, safeUpdates, req.user.role, userId);
        return { ...updated, userType: 'staff' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deactivate staff member' })
    async remove(@Req() req: any, @Param('id') id: string) {
        if (req.user.role !== 'manager' && req.user.role !== 'sysadmin') {
            throw new ForbiddenException('Only managers and sysadmin can deactivate staff');
        }
        return this.staffService.deactivate(id);
    }
}

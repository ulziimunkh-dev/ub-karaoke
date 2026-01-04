import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
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
            ? (organizationId ? Number(organizationId) : undefined)
            : (req.user.organizationId ? Number(req.user.organizationId) : undefined);
        return this.staffService.findAll(orgId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get staff details' })
    async findOne(@Param('id') id: string) {
        return this.staffService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update staff member' })
    async update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() updateStaffDto: Partial<CreateStaffDto>
    ) {
        if (req.user.role !== 'manager' && req.user.role !== 'sysadmin') {
            throw new ForbiddenException('Only managers and sysadmin can update staff');
        }
        return this.staffService.update(+id, updateStaffDto, req.user.role);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deactivate staff member' })
    async remove(@Req() req: any, @Param('id') id: string) {
        if (req.user.role !== 'manager' && req.user.role !== 'sysadmin') {
            throw new ForbiddenException('Only managers and sysadmin can deactivate staff');
        }
        return this.staffService.deactivate(+id);
    }
}

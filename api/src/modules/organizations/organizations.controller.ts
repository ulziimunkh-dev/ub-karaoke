import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create organization (sysadmin only)' })
  async create(
    @Req() req: any,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    if (req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only sysadmin can create organizations');
    }
    return this.organizationsService.create(createOrganizationDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations (sysadmin only)' })
  async findAll(
    @Req() req: any,
    @Query('includeInactive') includeInactive?: string,
  ) {
    if (req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only sysadmin can view all organizations');
    }
    return this.organizationsService.findAll({
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    // Sysadmin can view any org, others can only view their own
    if (req.user.role !== 'sysadmin' && req.user.organizationId !== id) {
      throw new ForbiddenException('Cannot access other organization data');
    }
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization (sysadmin only)' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateOrganizationDto: Partial<CreateOrganizationDto>,
  ) {
    if (req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only sysadmin can update organizations');
    }
    return this.organizationsService.update(
      id,
      updateOrganizationDto,
      req.user.id,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update organization status (sysadmin only)' })
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    if (req.user.role !== 'sysadmin') {
      throw new ForbiddenException(
        'Only sysadmin can update organization status',
      );
    }
    return this.organizationsService.updateStatus(id, isActive, req.user.id);
  }

  @Get(':id/plan-history')
  @ApiOperation({ summary: 'Get organization plan history (sysadmin only)' })
  async getPlanHistory(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only sysadmin can view plan history');
    }
    return this.organizationsService.getPlanHistory(id);
  }

  @Post(':id/extend-plan')
  @ApiOperation({
    summary: 'Extend or change organization plan (Managers & Admins)',
  })
  async extendPlan(
    @Req() req: any,
    @Param('id') id: string,
    @Body() extensionData: { planId: string; durationMonths: number },
  ) {
    // Manager/Admin can only extend their own org, Sysadmin can extend any
    if (req.user.role !== 'sysadmin' && req.user.organizationId !== id) {
      throw new ForbiddenException('Cannot access other organization data');
    }
    return this.organizationsService.extendPlan(id, extensionData, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate organization (sysadmin only)' })
  async remove(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'sysadmin') {
      throw new ForbiddenException(
        'Only sysadmin can deactivate organizations',
      );
    }
    return this.organizationsService.deactivate(id, req.user.id);
  }
}

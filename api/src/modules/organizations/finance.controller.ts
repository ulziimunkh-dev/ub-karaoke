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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from '../organizations/organizations.service';

@ApiTags('finance')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('earnings')
  @ApiOperation({ summary: 'Get organization earnings' })
  async getEarnings(@Req() req: any, @Query() filters: any) {
    if (!req.user.organizationId && req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Not associated with an organization');
    }
    const orgId =
      req.user.role === 'sysadmin' && filters.organizationId
        ? filters.organizationId
        : req.user.organizationId;

    return this.organizationsService.getEarnings(orgId, filters);
  }

  @Get('earnings/total')
  @ApiOperation({ summary: 'Get total earnings' })
  async getTotalEarnings(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('organizationId') filtersOrgId?: string,
  ) {
    if (!req.user.organizationId && req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Not associated with an organization');
    }
    const orgId =
      req.user.role === 'sysadmin' && filtersOrgId
        ? filtersOrgId
        : req.user.organizationId;

    const total = await this.organizationsService.getTotalEarnings(
      orgId,
      status,
    );
    return { total };
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get organization payouts' })
  async getPayouts(@Req() req: any, @Query() filters: any) {
    if (!req.user.organizationId && req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Not associated with an organization');
    }
    const orgId =
      req.user.role === 'sysadmin' && filters.organizationId
        ? filters.organizationId
        : req.user.organizationId;

    return this.organizationsService.getPayouts(orgId, filters);
  }

  @Post('payout-request')
  @ApiOperation({ summary: 'Request a payout' })
  async requestPayout(
    @Req() req: any,
    @Body() data: { earningIds: string[]; payoutAccountId: string },
  ) {
    if (!req.user.organizationId) {
      throw new ForbiddenException(
        'Only organization members can request payouts',
      );
    }
    return this.organizationsService.createPayout(
      req.user.organizationId,
      {
        payoutAccountId: data.payoutAccountId,
        status: 'PENDING' as any,
      },
      data.earningIds,
      req.user.id,
    );
  }

  @Get('payout-accounts')
  @ApiOperation({ summary: 'Get payout accounts' })
  async getPayoutAccounts(
    @Req() req: any,
    @Query('organizationId') filtersOrgId?: string,
  ) {
    if (!req.user.organizationId && req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Not associated with an organization');
    }
    const orgId =
      req.user.role === 'sysadmin' && filtersOrgId
        ? filtersOrgId
        : req.user.organizationId;

    return this.organizationsService.getPayoutAccounts(orgId);
  }

  @Post('payout-accounts')
  @ApiOperation({ summary: 'Add payout account' })
  async addPayoutAccount(@Req() req: any, @Body() data: any) {
    if (!req.user.organizationId) {
      throw new ForbiddenException(
        'Only organization members can add payout accounts',
      );
    }
    return this.organizationsService.addPayoutAccount(
      req.user.organizationId,
      data,
      req.user.id,
    );
  }

  @Patch('payout-accounts/:id')
  @ApiOperation({ summary: 'Update payout account' })
  async updatePayoutAccount(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    // Here we should check ownership
    return this.organizationsService.updatePayoutAccount(id, data, req.user.id);
  }

  @Delete('payout-accounts/:id')
  @ApiOperation({ summary: 'Remove payout account' })
  async removePayoutAccount(@Req() req: any, @Param('id') id: string) {
    // Here we should check ownership
    return this.organizationsService.removePayoutAccount(id);
  }

  @Patch('payouts/:id/status')
  @ApiOperation({ summary: 'Update payout status (sysadmin only)' })
  async updatePayoutStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    if (req.user.role !== 'sysadmin') {
      throw new ForbiddenException('Only sysadmin can update payout status');
    }
    return this.organizationsService.updatePayoutStatus(
      id,
      status,
      req.user.id,
    );
  }
}

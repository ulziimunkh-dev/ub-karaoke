import { Controller, Get, Param, UseGuards, Req, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    findAll(
        @Req() req: any,
        @Query('action') action?: string,
        @Query('staffId') staffId?: string,
        @Query('organizationId') organizationId?: string,
    ) {
        const targetOrgId = req.user.role === 'sysadmin' ? organizationId : req.user.organizationId;
        return this.auditService.findAll(targetOrgId, action, staffId);
    }

    @Get('resource/:resource/:id')
    // @Roles('admin')
    findByResource(@Param('resource') resource: string, @Param('id') id: string) {
        return this.auditService.findByResource(resource, id);
    }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    // @Roles('admin') // Uncomment when Role guard is ready and if we want to restrict
    findAll() {
        return this.auditService.findAll();
    }

    @Get('resource/:resource/:id')
    // @Roles('admin')
    findByResource(@Param('resource') resource: string, @Param('id') id: string) {
        return this.auditService.findByResource(resource, id);
    }
}

import { Controller, Get, Post, Patch, Body, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
    constructor(private readonly promotionsService: PromotionsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new promotion' })
    create(@Body() createPromotionDto: any, @Req() req: any) {
        // Use organizationId from body (sysadmin) or JWT (staff/manager)
        const organizationId = createPromotionDto.organizationId || req.user.organizationId;
        return this.promotionsService.create({
            ...createPromotionDto,
            organizationId,
        }, req.user.id);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all promotions' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    findAll(@Req() req: any, @Query('includeInactive') includeInactive?: string) {
        return this.promotionsService.findAll(req.user.organizationId, includeInactive === 'true');
    }

    @Post('validate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Validate a promotion code' })
    validate(@Body('code') code: string, @Req() req: any) {
        return this.promotionsService.validateCode(code, req.user.organizationId);
    }

    @Post('validate-public')
    @ApiOperation({ summary: 'Validate a promotion code (public, by venueId)' })
    validatePublic(@Body() body: { code: string; venueId: string }) {
        return this.promotionsService.validateCodeByVenue(body.code, body.venueId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a promotion' })
    update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
        const organizationId = updateDto.organizationId || req.user.organizationId;
        return this.promotionsService.update(id, {
            ...updateDto,
            organizationId,
        });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a promotion' })
    remove(@Param('id') id: string) {
        return this.promotionsService.remove(id);
    }
}

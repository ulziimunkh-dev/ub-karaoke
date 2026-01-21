import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
    constructor(private readonly promotionsService: PromotionsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new promotion' })
    create(@Body() createPromotionDto: any, @Req() req: any) {
        return this.promotionsService.create({
            ...createPromotionDto,
            organizationId: req.user.organizationId
        }, req.user.id);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all promotions' })
    findAll(@Req() req: any) {
        return this.promotionsService.findAll(req.user.organizationId);
    }

    @Post('validate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Validate a promotion code' })
    validate(@Body('code') code: string, @Req() req: any) {
        return this.promotionsService.validateCode(code, req.user.organizationId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a promotion' })
    remove(@Param('id') id: string) {
        return this.promotionsService.remove(id);
    }
}

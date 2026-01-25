import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
    Patch as PatchMethod,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RoomsService } from '../rooms/rooms.service';

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
    constructor(
        private readonly venuesService: VenuesService,
        private readonly roomsService: RoomsService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new venue' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    create(@Body() createVenueDto: CreateVenueDto, @Req() req: any) {
        return this.venuesService.create(createVenueDto, req.user?.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all venues with optional filters' })
    @ApiQuery({ name: 'district', required: false })
    @ApiQuery({ name: 'priceRange', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'organizationId', required: false })
    @ApiQuery({ name: 'includeInactive', required: false })
    @ApiBearerAuth()
    findAll(
        @Req() req: any,
        @Query('district') district?: string,
        @Query('priceRange') priceRange?: string,
        @Query('search') search?: string,
        @Query('organizationId') organizationId?: string,
        @Query('includeInactive') includeInactive?: string,
    ) {
        let orgId = organizationId;

        // If manager or staff, force their organizationId
        if (req.user && (req.user.role === 'manager' || req.user.role === 'staff')) {
            orgId = req.user.organizationId;
        }

        // Only admins and staff can see inactive venues
        const shouldIncludeInactive = includeInactive === 'true' && req.user && (req.user.role === 'sysadmin' || req.user.role === 'manager' || req.user.role === 'staff');

        return this.venuesService.findAll({
            district,
            priceRange,
            search,
            organizationId: orgId,
            includeInactive: shouldIncludeInactive
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific venue by ID' })
    findOne(@Param('id') id: string) {
        return this.venuesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a venue' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() updateVenueDto: UpdateVenueDto, @Req() req: any) {
        return this.venuesService.update(id, updateVenueDto, req.user?.id);
    }

    @PatchMethod(':id/status')
    @ApiOperation({ summary: 'Toggle venue status' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean, @Req() req: any) {
        return this.venuesService.updateStatus(id, isActive, req.user?.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a venue' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.venuesService.remove(id);
    }

    @Post(':id/pricing')
    @ApiOperation({ summary: 'Add pricing to all rooms in a venue' })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async addVenuePricing(@Param('id') id: string, @Body() pricingData: any, @Req() req: any) {
        const venue = await this.venuesService.findOne(id);
        return this.roomsService.addVenuePricing(id, pricingData, req.user, venue.organizationId);
    }
}

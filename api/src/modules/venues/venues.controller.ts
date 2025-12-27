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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
    constructor(private readonly venuesService: VenuesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new venue' })
    create(@Body() createVenueDto: CreateVenueDto) {
        return this.venuesService.create(createVenueDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all venues with optional filters' })
    @ApiQuery({ name: 'district', required: false })
    @ApiQuery({ name: 'priceRange', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'organizationId', required: false })
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    findAll(
        @Req() req: any,
        @Query('district') district?: string,
        @Query('priceRange') priceRange?: string,
        @Query('search') search?: string,
        @Query('organizationId') organizationId?: string,
    ) {
        let orgId = organizationId ? +organizationId : undefined;

        // If manager or staff, force their organizationId
        if (req.user && (req.user.role === 'manager' || req.user.role === 'staff')) {
            orgId = req.user.organizationId;
        }

        return this.venuesService.findAll({ district, priceRange, search, organizationId: orgId });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific venue by ID' })
    findOne(@Param('id') id: string) {
        return this.venuesService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a venue' })
    update(@Param('id') id: string, @Body() updateVenueDto: UpdateVenueDto) {
        return this.venuesService.update(+id, updateVenueDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a venue' })
    remove(@Param('id') id: string) {
        return this.venuesService.remove(+id);
    }
}

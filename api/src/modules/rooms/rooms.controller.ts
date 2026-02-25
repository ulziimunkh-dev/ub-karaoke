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
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createRoomDto: CreateRoomDto, @Req() req: any) {
    return this.roomsService.create(createRoomDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms with optional filters' })
  @ApiQuery({ name: 'venueId', required: false })
  @ApiQuery({ name: 'isVIP', required: false })
  @ApiQuery({ name: 'minCapacity', required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(
    @Req() req: any,
    @Query('venueId') venueId?: string,
    @Query('isVIP') isVIP?: string,
    @Query('minCapacity') minCapacity?: string,
    @Query('organizationId') organizationId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    let orgId = organizationId;

    if (
      req.user &&
      (req.user.role === 'manager' || req.user.role === 'staff')
    ) {
      orgId = req.user.organizationId;
    }

    const shouldIncludeInactive =
      includeInactive === 'true' &&
      req.user &&
      (req.user.role === 'sysadmin' ||
        req.user.role === 'manager' ||
        req.user.role === 'staff');

    return this.roomsService.findAll({
      venueId,
      isVIP: isVIP === 'true',
      minCapacity: minCapacity ? +minCapacity : undefined,
      organizationId: orgId,
      includeInactive: shouldIncludeInactive,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific room by ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.roomsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a room' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @Req() req: any,
  ) {
    return this.roomsService.update(id, updateRoomDto, req.user?.id);
  }

  @PatchMethod(':id/status')
  @ApiOperation({ summary: 'Toggle room status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Req() req: any,
  ) {
    return this.roomsService.updateStatus(id, isActive, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a room' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.roomsService.remove(id, req.user);
  }

  @Post(':id/pricing')
  @ApiOperation({ summary: 'Add pricing to a room' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  addPricing(
    @Param('id') id: string,
    @Body() pricingData: any,
    @Req() req: any,
  ) {
    return this.roomsService.addPricing(id, pricingData, req.user);
  }

  @Delete('pricing/:pricingId')
  @ApiOperation({ summary: 'Remove pricing from a room' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  removePricing(@Param('pricingId') pricingId: string, @Req() req: any) {
    return this.roomsService.removePricing(pricingId, req.user);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add image to a room' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  addImage(@Param('id') id: string, @Body() imageData: any, @Req() req: any) {
    return this.roomsService.addImage(id, imageData, req.user);
  }

  @Delete('images/:imageId')
  @ApiOperation({ summary: 'Remove image from a room' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  removeImage(@Param('imageId') imageId: string, @Req() req: any) {
    return this.roomsService.removeImage(imageId, req.user);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Update sort orders for multiple rooms' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateSortOrders(
    @Body() orders: { roomId: string; sortOrder: number }[],
    @Req() req: any,
  ) {
    return this.roomsService.updateSortOrders(orders, req.user);
  }
}

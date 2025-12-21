import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new review' })
    create(@Body() createReviewDto: CreateReviewDto) {
        return this.reviewsService.create(createReviewDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all reviews, optionally filtered by venue' })
    @ApiQuery({ name: 'venueId', required: false })
    findAll(@Query('venueId') venueId?: string) {
        return this.reviewsService.findAll(venueId ? +venueId : undefined);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific review by ID' })
    findOne(@Param('id') id: string) {
        return this.reviewsService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a review' })
    update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
        return this.reviewsService.update(+id, updateReviewDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a review' })
    remove(@Param('id') id: string) {
        return this.reviewsService.remove(+id);
    }
}

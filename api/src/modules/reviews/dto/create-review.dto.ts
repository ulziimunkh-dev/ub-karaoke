import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
    @IsNumber()
    venueId: number;

    @IsNumber()
    @IsOptional()
    userId?: number;

    @IsString()
    userName: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    comment: string;
}

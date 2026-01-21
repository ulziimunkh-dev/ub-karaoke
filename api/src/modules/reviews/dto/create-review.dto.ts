import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
    @IsString()
    venueId: string;

    @IsString()
    @IsOptional()
    userId?: string;

    @IsString()
    userName: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    comment: string;
}

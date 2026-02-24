import { IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateBookingDto {
    @IsString()
    @IsOptional()
    userId?: string;

    @IsString()
    @IsOptional()
    roomId: string;

    @IsString({ each: true })
    @IsOptional()
    roomIds: string[];

    @IsString()
    venueId: string;

    @IsDateString()
    date: string;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsNumber()
    duration: number;

    @IsNumber()
    totalPrice: number;

    @IsString()
    customerName: string;

    @IsString()
    customerPhone: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsNumber()
    @IsOptional()
    pointsToUse?: number;

    @IsString()
    @IsOptional()
    promoCode?: string;
}

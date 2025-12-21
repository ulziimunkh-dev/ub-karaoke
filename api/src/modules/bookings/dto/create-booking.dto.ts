import { IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateBookingDto {
    @IsNumber()
    @IsOptional()
    userId?: number;

    @IsNumber()
    roomId: number;

    @IsNumber()
    venueId: number;

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
}

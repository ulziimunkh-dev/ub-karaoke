import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

export class CreateVenueDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsOptional()
    address: string;

    @IsString()
    @IsNotEmpty()
    district: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsString()
    @IsNotEmpty()
    priceRange: string;

    @IsArray()
    @IsOptional()
    amenities?: string[];

    @IsObject()
    @IsNotEmpty()
    openingHours: Record<string, string>;

    @IsArray()
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    featuredImage?: string;

    @IsString()
    @IsOptional()
    gmapLocation?: string;

    @IsOptional()
    isBookingEnabled?: boolean;

    @IsString()
    @IsOptional()
    bookingWindowStart?: string;

    @IsString()
    @IsOptional()
    bookingWindowEnd?: string;

    @IsNumber()
    @IsOptional()
    advanceBookingDays?: number;

    @IsNumber()
    @IsOptional()
    minBookingHours?: number;

    @IsNumber()
    @IsOptional()
    maxBookingHours?: number;

    @IsString()
    @IsOptional()
    organizationId?: string;
}

import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

export class CreateVenueDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
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

    @IsNumber()
    @IsOptional()
    latitude?: number;

    @IsNumber()
    @IsOptional()
    longitude?: number;

    @IsOptional()
    isBookingEnabled?: boolean;
}

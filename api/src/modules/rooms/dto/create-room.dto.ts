import {
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  venueId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  capacity: number;

  @IsNumber()
  hourlyRate: number;

  @IsBoolean()
  @IsOptional()
  isVIP?: boolean;

  @IsBoolean()
  @IsOptional()
  isBookingEnabled?: boolean;

  @IsString()
  condition: string;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsObject()
  @IsOptional()
  specs?: {
    microphones?: number;
    speaker?: string;
    screen?: number;
    seating?: string;
    ac?: string;
    sound?: string;
    lighting?: string[];
    cleaning?: number;
  };

  @IsObject()
  @IsOptional()
  partySupport?: {
    birthday?: boolean;
    decoration?: boolean;
  };

  @IsString()
  @IsOptional()
  view360Url?: string;

  @IsString()
  @IsOptional()
  roomTypeId?: string;

  @IsArray()
  @IsOptional()
  roomFeatureIds?: string[];

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

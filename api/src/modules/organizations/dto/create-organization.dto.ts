import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    planId?: string;

    @IsOptional()
    planStartedAt?: Date;

    @IsOptional()
    planEndsAt?: Date;
}

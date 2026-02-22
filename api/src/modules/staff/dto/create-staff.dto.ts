import { IsString, IsEmail, IsNotEmpty, IsEnum, IsOptional, MinLength, IsBoolean } from 'class-validator';
import { StaffRole } from '../entities/staff.entity';

export class CreateStaffDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsEnum(StaffRole)
    @IsNotEmpty()
    role: StaffRole;

    @IsOptional()
    @IsString()
    organizationId?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

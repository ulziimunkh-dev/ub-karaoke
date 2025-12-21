import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SignupDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

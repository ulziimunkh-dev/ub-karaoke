import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
    @IsNumber()
    amount: number;

    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @IsNumber()
    bookingId: number;

    @IsOptional()
    @IsString()
    transactionId?: string;

    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;
}

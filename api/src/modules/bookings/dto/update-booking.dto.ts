import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus, BookingPaymentStatus } from '../enums/booking.enums';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsEnum(BookingPaymentStatus)
  @IsOptional()
  paymentStatus?: BookingPaymentStatus;
}

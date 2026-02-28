import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Refund } from './entities/refund.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { SystemSetting } from '../app-settings/entities/system-setting.entity';
import { QpayService } from './qpay.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentTransaction, Refund, Booking, SystemSetting]),
    HttpModule,
    forwardRef(() => BookingsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, QpayService],
  exports: [PaymentsService],
})
export class PaymentsModule { }

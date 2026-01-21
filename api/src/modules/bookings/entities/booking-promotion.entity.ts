import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('booking_promotions')
export class BookingPromotion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'bookingId' })
    bookingId: string;

    @ManyToOne(() => Booking, (booking) => booking.promotions)
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column({ name: 'promotionId' })
    promotionId: string;

    @ManyToOne(() => Promotion)
    @JoinColumn({ name: 'promotionId' })
    promotion: Promotion;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

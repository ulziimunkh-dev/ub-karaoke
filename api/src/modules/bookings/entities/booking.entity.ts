import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Venue } from '../../venues/entities/venue.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../auth/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';
import { BookingStatusHistory } from './booking-status-history.entity';
import { BookingPromotion } from './booking-promotion.entity';
import { BookingStatus, BookingPaymentStatus, BookingSource } from '../enums/booking.enums';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'userId', nullable: true })
    userId: number;

    @Column({ name: 'roomId' })
    roomId: number;

    @Column({ name: 'venueId' })
    venueId: number;

    @Column({ name: 'startTime', type: 'timestamp' })
    startTime: Date;

    @Column({ name: 'endTime', type: 'timestamp' })
    endTime: Date;

    @Column({ name: 'totalPrice', type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING,
    })
    status: BookingStatus;

    @Column({
        type: 'enum',
        enum: BookingSource,
        default: BookingSource.ONLINE,
    })
    source: BookingSource;

    @Column({ name: 'customerName' })
    customerName: string;

    @Column({ name: 'customerPhone' })
    customerPhone: string;

    @Column({ name: 'specialRequests', type: 'text', nullable: true })
    specialRequests: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Room, (room) => room.bookings)
    @JoinColumn({ name: 'roomId' })
    room: Room;

    @ManyToOne(() => Venue)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;

    @Column({ name: 'organization_id', nullable: true })
    organizationId: number;

    @ManyToOne(() => Promotion, { nullable: true })
    @JoinColumn({ name: 'appliedPromotionId' })
    promotion: Promotion;

    @Column({ name: 'appliedPromotionId', nullable: true })
    appliedPromotionId: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;

    @OneToMany(() => BookingStatusHistory, (history) => history.booking)
    statusHistory: BookingStatusHistory[];

    @OneToMany(() => BookingPromotion, (bookingPromotion) => bookingPromotion.booking)
    promotions: BookingPromotion[];
}

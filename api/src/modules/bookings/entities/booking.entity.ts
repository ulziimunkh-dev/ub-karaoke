import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Venue } from '../../venues/entities/venue.entity';

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    REJECTED = 'REJECTED',
}

export enum BookingPaymentStatus {
    UNPAID = 'UNPAID',
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    REFUNDED = 'REFUNDED',
}

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    userId: number;

    @Column()
    roomId: number;

    @Column()
    venueId: number;

    @Column('date')
    date: Date;

    @Column('time')
    startTime: string;

    @Column('time')
    endTime: string;

    @Column()
    duration: number;

    @Column('decimal', { precision: 10, scale: 2 })
    totalPrice: number;

    @Column({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING,
    })
    status: BookingStatus;

    @Column()
    customerName: string;

    @Column()
    customerPhone: string;

    @Column({
        type: 'enum',
        enum: BookingPaymentStatus,
        default: BookingPaymentStatus.UNPAID,
    })
    paymentStatus: BookingPaymentStatus;

    @Column({ default: 'cash' })
    paymentMethod: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Room, (room) => room.bookings)
    @JoinColumn({ name: 'roomId' })
    room: Room;

    @ManyToOne(() => Venue)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;
}

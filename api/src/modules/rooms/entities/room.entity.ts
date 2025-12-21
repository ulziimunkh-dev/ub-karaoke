import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Venue } from '../../venues/entities/venue.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    venueId: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    type: string; // Standard, VIP, Party, Themed, Small

    @Column()
    capacity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    hourlyRate: number;

    @Column({ default: false })
    isVIP: boolean;

    @Column()
    condition: string;

    @Column('simple-json')
    amenities: string[];

    @Column('simple-json', { nullable: true })
    features: string[];

    @Column('simple-json')
    images: string[];

    @Column('simple-json', { nullable: true })
    specs: {
        microphones?: number;
        speaker?: string;
        screen?: number;
        seating?: string;
        ac?: string;
        sound?: string;
        lighting?: string[];
        cleaning?: number;
    };

    @Column('simple-json', { nullable: true })
    partySupport: {
        birthday?: boolean;
        decoration?: boolean;
    };

    @Column({ nullable: true })
    view360Url: string;

    @ManyToOne(() => Venue, (venue) => venue.rooms)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;

    @OneToMany(() => Booking, (booking) => booking.room)
    bookings: Booking[];
}

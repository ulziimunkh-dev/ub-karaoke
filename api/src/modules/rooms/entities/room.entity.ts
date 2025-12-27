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
import { Venue } from '../../venues/entities/venue.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'venueId' })
    venueId: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    type: string; // Standard, VIP, Party, Themed, Small

    @Column()
    capacity: number;

    @Column('decimal', { name: 'hourlyRate', precision: 10, scale: 2 })
    hourlyRate: number;

    @Column({ name: 'isVIP', default: false })
    isVIP: boolean;

    @Column()
    condition: string;

    @Column('jsonb', { name: 'amenities' })
    amenities: string[];

    @Column('jsonb', { name: 'features', nullable: true })
    features: string[];

    @Column('jsonb', { name: 'images' })
    images: string[];

    @Column('jsonb', { name: 'specs', nullable: true })
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

    @Column('jsonb', { name: 'partySupport', nullable: true })
    partySupport: {
        birthday?: boolean;
        decoration?: boolean;
    };

    @Column({ name: 'view360Url', nullable: true })
    view360Url: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Venue, (venue) => venue.rooms)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: number;

    @OneToMany(() => Booking, (booking) => booking.room)
    bookings: Booking[];
}

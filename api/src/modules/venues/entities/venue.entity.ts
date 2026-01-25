import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { VenueOperatingHours } from './venue-operating-hours.entity';
import { RoomPricing } from '../../rooms/entities/room-pricing.entity';

@Entity('venues')
export class Venue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('text')
    description: string;

    @Column()
    address: string;

    @Column()
    district: string;

    @Column()
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ name: 'priceRange', nullable: true })
    priceRange: string;

    @Column('decimal', { precision: 3, scale: 2, default: 0 })
    rating: number;

    @Column({ name: 'totalReviews', default: 0 })
    totalReviews: number;

    @Column('jsonb', { name: 'amenities' })
    amenities: string[];

    @Column('jsonb', { name: 'openingHours' })
    openingHours: Record<string, string>;

    @Column('jsonb', { name: 'images' })
    images: string[];

    @Column({ name: 'featuredImage', nullable: true })
    featuredImage: string;

    @Column({ name: 'gmap_location', nullable: true })
    gmapLocation: string;

    @Column({ name: 'isBookingEnabled', default: true })
    isBookingEnabled: boolean;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'bookingWindowStart', nullable: true })
    bookingWindowStart: string;

    @Column({ name: 'bookingWindowEnd', nullable: true })
    bookingWindowEnd: string;

    @Column({ name: 'advanceBookingDays', default: 3 })
    advanceBookingDays: number;

    @Column('decimal', { name: 'minBookingHours', precision: 5, scale: 2, default: 1.0 })
    minBookingHours: number;

    @Column('decimal', { name: 'maxBookingHours', precision: 5, scale: 2, default: 6.0 })
    maxBookingHours: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;

    @ManyToOne(() => Organization, org => org.venues)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true })
    organizationId: string;

    @OneToMany(() => Room, (room) => room.venue)
    rooms: Room[];

    @OneToMany(() => Review, (review) => review.venue)
    reviews: Review[];

    @OneToMany(() => VenueOperatingHours, (hours) => hours.venue)
    operatingHours: VenueOperatingHours[];

    @OneToMany(() => RoomPricing, (pricing) => pricing.venue)
    pricing: RoomPricing[];
}

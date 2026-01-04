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

@Entity('venues')
export class Venue {
    @PrimaryGeneratedColumn()
    id: number;

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

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ name: 'isBookingEnabled', default: true })
    isBookingEnabled: boolean;

    @Column({ name: 'bookingWindowStart', nullable: true })
    bookingWindowStart: string;

    @Column({ name: 'bookingWindowEnd', nullable: true })
    bookingWindowEnd: string;

    @Column({ name: 'advanceBookingDays', default: 3 })
    advanceBookingDays: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;

    @ManyToOne(() => Organization, org => org.venues)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', nullable: true, insert: false, update: false })
    organizationId: number;

    @OneToMany(() => Room, (room) => room.venue)
    rooms: Room[];

    @OneToMany(() => Review, (review) => review.venue)
    reviews: Review[];
}

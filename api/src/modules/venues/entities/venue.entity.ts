import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Review } from '../../reviews/entities/review.entity';

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

    @Column({ nullable: true })
    website: string;

    @Column()
    priceRange: string;

    @Column('decimal', { precision: 3, scale: 2, default: 0 })
    rating: number;

    @Column({ default: 0 })
    totalReviews: number;

    @Column('simple-json')
    amenities: string[];

    @Column('simple-json')
    openingHours: Record<string, string>;

    @Column('simple-json')
    images: string[];

    @Column({ nullable: true })
    featuredImage: string;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ default: true })
    isBookingEnabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Room, (room) => room.venue)
    rooms: Room[];

    @OneToMany(() => Review, (review) => review.venue)
    reviews: Review[];
}

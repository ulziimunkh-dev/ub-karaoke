import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Venue } from '../../venues/entities/venue.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    venueId: number;

    @Column({ nullable: true })
    userId: number;

    @Column()
    userName: string;

    @Column()
    rating: number;

    @Column('text')
    comment: string;

    @Column({ default: false })
    verified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Venue, (venue) => venue.reviews)
    @JoinColumn({ name: 'venueId' })
    venue: Venue;
}

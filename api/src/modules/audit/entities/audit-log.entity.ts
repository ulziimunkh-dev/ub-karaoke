import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    action: string;

    @Column()
    resource: string; // e.g., 'Booking', 'Payment'

    @Column({ nullable: true })
    resourceId: string;

    @Column('json', { nullable: true })
    details: any;

    @Column({ nullable: true })
    userId: number;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}

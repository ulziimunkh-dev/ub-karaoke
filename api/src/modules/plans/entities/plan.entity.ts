import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string; // STARTER, GROWTH, FRANCHISE

    @Column()
    name: string;

    @Column({ name: 'monthly_fee', type: 'integer' })
    monthlyFee: number;

    @Column({ name: 'commission_rate', type: 'decimal', precision: 4, scale: 2 })
    commissionRate: number;

    @Column({ name: 'max_branches', nullable: true })
    maxBranches: number; // null = unlimited

    @Column({ name: 'max_rooms', nullable: true })
    maxRooms: number; // null = unlimited

    @Column({ type: 'jsonb', nullable: true })
    features: any;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => Organization, org => org.plan)
    organizations: Organization[];
}

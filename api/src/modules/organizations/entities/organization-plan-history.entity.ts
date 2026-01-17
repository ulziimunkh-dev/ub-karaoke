import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { Plan } from '../../plans/entities/plan.entity';

@Entity('organization_plan_history')
export class OrganizationPlanHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'organization_id' })
    organizationId: number;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'plan_id', nullable: true })
    planId: string;

    @ManyToOne(() => Plan, { nullable: true })
    @JoinColumn({ name: 'plan_id' })
    plan: Plan;

    // Snapshot fields
    @Column({ name: 'plan_name' })
    planName: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
    commissionRate: number;

    // Period
    @Column({ name: 'start_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
    endDate: Date;

    @Column({ default: 'active' })
    status: string; // active, completed, changed

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Staff } from '../../staff/entities/staff.entity';
import { Venue } from '../../venues/entities/venue.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { OrganizationPayoutAccount } from './organization-payout-account.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 10 })
    code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    // Plans
    @Column({ name: 'plan_id', nullable: true })
    planId: string;

    @ManyToOne(() => Plan, plan => plan.organizations, { nullable: true })
    @JoinColumn({ name: 'plan_id' })
    plan: Plan;

    @Column({ name: 'plan_started_at', type: 'timestamptz', nullable: true })
    planStartedAt: Date;

    @Column({ name: 'plan_ends_at', type: 'timestamptz', nullable: true })
    planEndsAt: Date;

    @Column({ nullable: true })
    status: string; // active, suspended, etc.

    @OneToMany(() => Staff, staff => staff.organization)
    staff: Staff[];

    @OneToMany(() => Venue, venue => venue.organization)
    venues: Venue[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: number;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: number;

    @OneToMany(() => OrganizationPayoutAccount, (account) => account.organization)
    payoutAccounts: OrganizationPayoutAccount[];
}

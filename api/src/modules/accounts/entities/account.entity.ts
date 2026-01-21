import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum AccountType {
    ASSET = 'ASSET',
    LIABILITY = 'LIABILITY',
    REVENUE = 'REVENUE',
    EXPENSE = 'EXPENSE',
}

export enum OwnerType {
    PLATFORM = 'PLATFORM',
    ORGANIZATION = 'ORGANIZATION',
}

@Entity('accounts')
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 20 })
    code: string;

    @Column({ type: 'text' })
    name: string;

    @Column({
        type: 'enum',
        enum: AccountType,
    })
    type: AccountType;

    @Column({
        type: 'enum',
        enum: OwnerType,
        name: 'owner_type',
    })
    ownerType: OwnerType;

    @Column({ name: 'owner_id', nullable: true })
    ownerId: string;

    @ManyToOne(() => Organization, { nullable: true })
    @JoinColumn({ name: 'owner_id' })
    owner: Organization;

    @Column({ length: 3, default: 'MNT' })
    currency: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @Column({ name: 'updated_by', nullable: true })
    updatedBy: string;
}

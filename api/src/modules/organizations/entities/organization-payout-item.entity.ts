import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { OrganizationPayout } from './organization-payout.entity';
import { OrganizationEarning } from './organization-earning.entity';

@Entity('organization_payout_items')
export class OrganizationPayoutItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payout_id' })
  payoutId: string;

  @ManyToOne(() => OrganizationPayout, (payout) => payout.items)
  @JoinColumn({ name: 'payout_id' })
  payout: OrganizationPayout;

  @Column({ name: 'earning_id' })
  earningId: string;

  @ManyToOne(() => OrganizationEarning)
  @JoinColumn({ name: 'earning_id' })
  earning: OrganizationEarning;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

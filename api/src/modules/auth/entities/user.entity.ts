import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_code', type: 'varchar', nullable: true })
  verificationCode: string | null;

  @Column({ name: 'verification_code_expiry', type: 'timestamp', nullable: true })
  verificationCodeExpiry: Date | null;

  @Column({ type: 'varchar', nullable: true })
  otp: string | null;

  @Column({ name: 'otp_expiry', type: 'timestamp', nullable: true })
  otpExpiry: Date | null;

  @Column({ name: 'reset_token', type: 'varchar', nullable: true })
  resetToken: string | null;

  @Column({ name: 'reset_token_expiry', type: 'timestamp', nullable: true })
  resetTokenExpiry: Date | null;

  @Column({ name: 'last_otp_sent_at', type: 'timestamp', nullable: true })
  lastOtpSentAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}

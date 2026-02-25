import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('room_images')
export class RoomImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'roomId' })
  roomId: string;

  @ManyToOne(() => Room, (room) => room.imagesList)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  imageUrl: string;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({
    name: 'organization_id',
    nullable: true,
    insert: false,
    update: false,
  })
  organizationId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

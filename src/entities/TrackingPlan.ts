import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { TrackingPlanEvent } from './TrackingPlanEvent';

@Entity('tracking_plans')
@Index(['name'], { unique: true })
export class TrackingPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  create_time: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  update_time: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relationships
  @OneToMany(() => TrackingPlanEvent, trackingPlanEvent => trackingPlanEvent.trackingPlan)
  trackingPlanEvents: TrackingPlanEvent[];
} 
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToMany, OneToMany } from 'typeorm';
import { EventType } from '../types';
import { TrackingPlanEvent } from './TrackingPlanEvent';
import { EventProperty } from './EventProperty';

@Entity('events')
@Index(['name', 'type'], { unique: true })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: EventType
  })
  type: EventType;

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
  @OneToMany(() => TrackingPlanEvent, trackingPlanEvent => trackingPlanEvent.event)
  trackingPlanEvents: TrackingPlanEvent[];

  @OneToMany(() => EventProperty, eventProperty => eventProperty.event)
  eventProperties: EventProperty[];
} 
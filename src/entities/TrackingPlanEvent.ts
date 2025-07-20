import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, OneToMany } from 'typeorm';
import { TrackingPlan } from './TrackingPlan';
import { Event } from './Event';
import { EventProperty } from './EventProperty';

@Entity('tracking_plan_events')
@Index(['tracking_plan_id', 'event_id'], { unique: true })
export class TrackingPlanEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tracking_plan_id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @Column({ type: 'boolean', default: false })
  additional_properties: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relationships
  @ManyToOne(() => TrackingPlan, trackingPlan => trackingPlan.trackingPlanEvents)
  @JoinColumn({ name: 'tracking_plan_id' })
  trackingPlan: TrackingPlan;

  @ManyToOne(() => Event, event => event.trackingPlanEvents)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @OneToMany(() => EventProperty, eventProperty => eventProperty.trackingPlanEvent)
  eventProperties: EventProperty[];
} 
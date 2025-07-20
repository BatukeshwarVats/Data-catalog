import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { TrackingPlanEvent } from './TrackingPlanEvent';
import { Property } from './Property';
import { Event } from './Event';

@Entity('event_properties')
@Index(['tracking_plan_event_id', 'property_id'], { unique: true })
export class EventProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tracking_plan_event_id: string;

  @Column({ type: 'uuid' })
  property_id: string;

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relationships
  @ManyToOne(() => TrackingPlanEvent, trackingPlanEvent => trackingPlanEvent.eventProperties)
  @JoinColumn({ name: 'tracking_plan_event_id' })
  trackingPlanEvent: TrackingPlanEvent;

  @ManyToOne(() => Property, property => property.eventProperties)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Event, event => event.eventProperties)
  @JoinColumn({ name: 'event_id' })
  event: Event;
} 
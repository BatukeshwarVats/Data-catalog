import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { PropertyType, PropertyValidationRules } from '../types';
import { EventProperty } from './EventProperty';

@Entity('properties')
@Index(['name', 'type'], { unique: true })
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: PropertyType
  })
  type: PropertyType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  validation_rules: PropertyValidationRules | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  create_time: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  update_time: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  // Relationships
  @OneToMany(() => EventProperty, eventProperty => eventProperty.property)
  eventProperties: EventProperty[];
} 
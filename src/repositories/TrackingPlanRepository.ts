import { FindOptionsWhere, ILike, Not } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { TrackingPlan } from '../entities/TrackingPlan';
import { TrackingPlanFilter } from '../types';

export class TrackingPlanRepository extends BaseRepository<TrackingPlan> {
  constructor() {
    super(TrackingPlan);
  }

  async findByName(name: string): Promise<TrackingPlan | null> {
    return this.repository.findOne({
      where: { name, is_deleted: false },
    });
  }

  async findByFilter(filter: TrackingPlanFilter): Promise<TrackingPlan[]> {
    const where: FindOptionsWhere<TrackingPlan> = {
      is_deleted: false,
    };

    if (filter.name) {
      where.name = ILike(`%${filter.name}%`);
    }

    if (filter.description) {
      where.description = ILike(`%${filter.description}%`);
    }

    return this.repository.find({ where });
  }

  async existsByName(name: string): Promise<boolean> {
    return this.exists({ name });
  }

  async findByNameExcludingId(name: string, excludeId: string): Promise<TrackingPlan | null> {
    return this.repository.findOne({
      where: { 
        name, 
        is_deleted: false,
        id: Not(excludeId)
      },
    });
  }

  async findWithEvents(id: string): Promise<TrackingPlan | null> {
    return this.repository.findOne({
      where: { id, is_deleted: false },
      relations: {
        trackingPlanEvents: {
          event: true,
          eventProperties: {
            property: true
          }
        }
      }
    });
  }

  async findAllWithEvents(): Promise<TrackingPlan[]> {
    return this.repository.find({
      where: { is_deleted: false },
      relations: {
        trackingPlanEvents: {
          event: true,
          eventProperties: {
            property: true
          }
        }
      }
    });
  }

  async searchByName(searchTerm: string): Promise<TrackingPlan[]> {
    return this.repository.find({
      where: { 
        name: ILike(`%${searchTerm}%`),
        is_deleted: false 
      },
    });
  }

  async findByNameWithEvents(name: string): Promise<TrackingPlan | null> {
    return this.repository.findOne({
      where: { name, is_deleted: false },
      relations: {
        trackingPlanEvents: {
          event: true,
          eventProperties: {
            property: true
          }
        }
      }
    });
  }
} 
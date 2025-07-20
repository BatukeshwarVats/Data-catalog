import { FindOptionsWhere, ILike, In, Not } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Event } from '../entities/Event';
import { EventType, EventFilter } from '../types';

export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super(Event);
  }

  async findByNameAndType(name: string, type: EventType): Promise<Event | null> {
    return this.repository.findOne({
      where: { name, type, is_deleted: false },
    });
  }

  async findByFilter(filter: EventFilter): Promise<Event[]> {
    const where: FindOptionsWhere<Event> = {
      is_deleted: false,
    };

    if (filter.name) {
      where.name = ILike(`%${filter.name}%`);
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.description) {
      where.description = ILike(`%${filter.description}%`);
    }

    return this.repository.find({ where });
  }

  async existsByNameAndType(name: string, type: EventType): Promise<boolean> {
    return this.exists({ name, type });
  }

  async findByNameAndTypeExcludingId(name: string, type: EventType, excludeId: string): Promise<Event | null> {
    return this.repository.findOne({
      where: { 
        name, 
        type, 
        is_deleted: false,
        id: Not(excludeId)
      },
    });
  }

  async findByIds(ids: string[]): Promise<Event[]> {
    return this.repository.find({
      where: { 
        id: In(ids),
        is_deleted: false 
      },
    });
  }

  async findByTypes(types: EventType[]): Promise<Event[]> {
    return this.repository.find({
      where: { 
        type: In(types),
        is_deleted: false 
      },
    });
  }

  async searchByName(searchTerm: string): Promise<Event[]> {
    return this.repository.find({
      where: { 
        name: ILike(`%${searchTerm}%`),
        is_deleted: false 
      },
    });
  }
} 
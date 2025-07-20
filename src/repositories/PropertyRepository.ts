import { FindOptionsWhere, ILike, In, Not } from 'typeorm';
import { BaseRepository } from './BaseRepository';
import { Property } from '../entities/Property';
import { PropertyType, PropertyFilter } from '../types';

export class PropertyRepository extends BaseRepository<Property> {
  constructor() {
    super(Property);
  }

  async findByNameAndType(name: string, type: PropertyType): Promise<Property | null> {
    return this.repository.findOne({
      where: { name, type, is_deleted: false },
    });
  }

  async findByFilter(filter: PropertyFilter): Promise<Property[]> {
    const where: FindOptionsWhere<Property> = {
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

  async existsByNameAndType(name: string, type: PropertyType): Promise<boolean> {
    return this.exists({ name, type });
  }

  async findByNameAndTypeExcludingId(name: string, type: PropertyType, excludeId: string): Promise<Property | null> {
    return this.repository.findOne({
      where: { 
        name, 
        type, 
        is_deleted: false,
        id: Not(excludeId)
      },
    });
  }

  async findByIds(ids: string[]): Promise<Property[]> {
    return this.repository.find({
      where: { 
        id: In(ids),
        is_deleted: false 
      },
    });
  }

  async findByTypes(types: PropertyType[]): Promise<Property[]> {
    return this.repository.find({
      where: { 
        type: In(types),
        is_deleted: false 
      },
    });
  }

  async searchByName(searchTerm: string): Promise<Property[]> {
    return this.repository.find({
      where: { 
        name: ILike(`%${searchTerm}%`),
        is_deleted: false 
      },
    });
  }

  async findByNameAndTypeList(items: Array<{ name: string; type: PropertyType }>): Promise<Property[]> {
    const conditions = items.map(item => ({
      name: item.name,
      type: item.type,
      is_deleted: false
    }));

    return this.repository.find({
      where: conditions,
    });
  }
} 
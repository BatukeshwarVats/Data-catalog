import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial, ObjectLiteral } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PaginationOptions, PaginatedResponse } from '../types';

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(entityClass: new () => T) {
    this.repository = AppDataSource.getRepository(entityClass);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({
      where: { id, is_deleted: false } as any,
    });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: { ...options?.where, is_deleted: false } as any,
    });
  }

  async findWithPagination(
    options: FindManyOptions<T>,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      ...options,
      where: { ...options?.where, is_deleted: false } as any,
      skip,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      is_deleted: true,
      deleted_at: new Date(),
    } as any);

    return result.affected === 1;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected === 1;
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({
      where: { ...where, is_deleted: false } as any,
    });
    return count > 0;
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({
      where: { ...where, is_deleted: false } as any,
    });
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
} 
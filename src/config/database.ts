import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { Event } from '../entities/Event';
import { Property } from '../entities/Property';
import { TrackingPlan } from '../entities/TrackingPlan';
import { TrackingPlanEvent } from '../entities/TrackingPlanEvent';
import { EventProperty } from '../entities/EventProperty';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'data_catalog',
  synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
  logging: process.env.DB_LOGGING === 'true' || false,
  entities: [Event, Property, TrackingPlan, TrackingPlanEvent, EventProperty],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}; 
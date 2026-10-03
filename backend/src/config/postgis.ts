import { Pool } from 'pg';
import { ENV } from './env';

export const pgPool = new Pool({
  connectionString: ENV.PG_URI,
});

export const connectPostGIS = async (): Promise<void> => {
  try {
    const client = await pgPool.connect();
    
    // Enable postgis extension if not enabled
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    // Create a mock table for spatial analysis (e.g. disaster_zones) if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS disaster_zones (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        geom GEOMETRY(Polygon, 4326) NOT NULL
      );
    `);
    
    // Create index on geom
    await client.query(`
      CREATE INDEX IF NOT EXISTS disaster_zones_geom_idx 
      ON disaster_zones USING GIST (geom);
    `);

    client.release();
  } catch (error) {
  }
};

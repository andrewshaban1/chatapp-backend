/**
 * E2E test setup. Runs before any e2e test files.
 * Loads .env so TEST_DB_NAME is available, then overrides DB_HOST to localhost
 * so tests running on the host can connect to Postgres test database (e.g. in Docker with port 5432 exposed).
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

process.env.DB_NAME = process.env.TEST_DB_NAME;

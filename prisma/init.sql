-- Initialize BizCore database
-- This file runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bizcore user for PgBouncer
CREATE USER bizcore WITH PASSWORD 'password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE bizcore_dev TO bizcore;

-- Create any initial data or schemas here
-- The Prisma migrations will handle the actual schema creation
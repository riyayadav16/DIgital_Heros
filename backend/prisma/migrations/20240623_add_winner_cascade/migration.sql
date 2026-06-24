-- Migration: Add onDelete Cascade to Winner foreign keys
-- Run this in Supabase SQL Editor if prisma migrate dev is unavailable

ALTER TABLE IF EXISTS "Winner" DROP CONSTRAINT IF EXISTS "Winner_userId_fkey";
ALTER TABLE IF EXISTS "Winner" ADD CONSTRAINT "Winner_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS "Winner" DROP CONSTRAINT IF EXISTS "Winner_drawId_fkey";
ALTER TABLE IF EXISTS "Winner" ADD CONSTRAINT "Winner_drawId_fkey" 
  FOREIGN KEY ("drawId") REFERENCES "Draw"(id) ON DELETE CASCADE;

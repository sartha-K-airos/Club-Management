// src/lib/prisma.js — shared Prisma client singleton optimized for Supabase Serverless
const { PrismaClient } = require('@prisma/client');

let dbUrl = process.env.DATABASE_URL || '';

// Automatically upgrade Supabase pooler from session mode (5432, max 15 clients)
// to transaction mode (6543, infinite serverless concurrency via PgBouncer)
if (dbUrl.includes('.pooler.supabase.com:5432')) {
  dbUrl = dbUrl.replace(':5432', ':6543');
}
if (dbUrl.includes('.pooler.supabase.com:6543') && !dbUrl.includes('pgbouncer=true')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true&connection_limit=1';
}

let prisma;
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: { db: { url: dbUrl } }
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;

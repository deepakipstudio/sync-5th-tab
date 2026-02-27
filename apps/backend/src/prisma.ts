import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle connection errors with better logging
prisma.$on('error' as never, (e: any) => {
  console.error('Prisma Client Error:', e);
});

// Test connection on startup
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    if (error.message?.includes("Can't reach database server")) {
      console.error('\n💡 Troubleshooting steps:');
      console.error('1. Check if your Neon database is active (it may have paused)');
      console.error('2. Visit https://console.neon.tech/ to wake up your database');
      console.error('3. Verify your DATABASE_URL in .env is correct');
      console.error('4. Try using the direct connection string instead of pooler');
    }
    // Don't exit - let the app start and retry on first query
  }
}

// Test connection asynchronously (non-blocking)
testConnection().catch(() => {
  // Ignore errors during startup test
});

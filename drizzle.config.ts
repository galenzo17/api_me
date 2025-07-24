import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schemas/*.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database.db',
  },
} satisfies Config;
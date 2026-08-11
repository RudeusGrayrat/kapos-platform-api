const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const command = process.argv[2] ?? 'count';
  const client = createDatabaseClient();

  try {
    await client.connect();

    if (command === 'count') {
      const counts = await readIdentityCounts(client);
      printCounts(counts);
      return;
    }

    if (command === 'clear') {
      const beforeCounts = await readIdentityCounts(client);
      printCounts(beforeCounts);

      await client.query('BEGIN');
      await client.query('DELETE FROM "Session"');
      await client.query('DELETE FROM "OAuthAccount"');
      await client.query('DELETE FROM "User"');
      await client.query('COMMIT');

      const afterCounts = await readIdentityCounts(client);
      printCounts(afterCounts);
      return;
    }

    throw new Error(`Unknown command "${command}". Use "count" or "clear".`);
  } catch (error) {
    await rollbackQuietly(client);
    throw error;
  } finally {
    await client.end();
  }
}

function createDatabaseClient() {
  const databaseUrl = readDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run identity maintenance.');
  }

  return new Client({
    connectionString: databaseUrl,
  });
}

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envPath = path.resolve(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');

  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#') || !line.startsWith('DATABASE_URL=')) {
      continue;
    }

    return line.slice('DATABASE_URL='.length).trim().replace(/^"(.*)"$/, '$1');
  }

  return undefined;
}

async function readIdentityCounts(client) {
  const users = await client.query('SELECT COUNT(*)::int AS count FROM "User"');
  const sessions = await client.query('SELECT COUNT(*)::int AS count FROM "Session"');
  const oAuthAccounts = await client.query(
    'SELECT COUNT(*)::int AS count FROM "OAuthAccount"',
  );
  const migrations = await client.query(
    'SELECT COUNT(*)::int AS count FROM "_prisma_migrations"',
  );

  return {
    users: users.rows[0]?.count ?? 0,
    sessions: sessions.rows[0]?.count ?? 0,
    oAuthAccounts: oAuthAccounts.rows[0]?.count ?? 0,
    migrations: migrations.rows[0]?.count ?? 0,
  };
}

async function rollbackQuietly(client) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Si no había transacción activa, no necesitamos hacer nada.
  }
}

function printCounts(counts) {
  console.log(`User=${counts.users}`);
  console.log(`Session=${counts.sessions}`);
  console.log(`OAuthAccount=${counts.oAuthAccounts}`);
  console.log(`_prisma_migrations=${counts.migrations}`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error.';
  console.error(message);
  process.exitCode = 1;
});

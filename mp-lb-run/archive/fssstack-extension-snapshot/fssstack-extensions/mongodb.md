# MongoDB Setup

This guide covers setting up MongoDB for your application.

## Environment Variables

This extension adds the following environment variables:

## After Adding This Extension

Update the following files:

### 1. docs/env-vars.md

Add to the registry table:

```markdown
| `MONGODB_URL` | MongoDB connection string | backend, worker | Yes | Yes | Yes | Yes |
```

### 2. deployment-runbook.md

Add `MONGODB_URL` to the secrets table.

## Local Development

Add to `zap.yaml`:

```yaml
docker:
  mongodb:
    aliases: [db]
    image: mongo:latest
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongodb-data:/data/db
```

Also add `ports: [MONGO_PORT]`  if thers no ports field, or just append `MONGO_PORT` to the list of ports if it does.

Add to `.env.local`:

```bash
MONGODB_URL=mongodb://localhost:${MONGO_PORT}/helloworld?directConnection=true
```

`MONGO_PORT` is a local-only Zapper port variable. Add it to the top-level
`ports` array instead of hardcoding host port `27017`, so each generated app can
use its assigned MongoDB port without conflicting with other projects.

## Dependencies

```bash
pnpm add mongodb
```

## Connection Setup

Create a connection manager in your app:

```typescript
// apps/<backend-service>/src/db.ts
import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;

export const getMongoClient = async (url: string): Promise<MongoClient> => {
  if (client) return client;
  client = new MongoClient(url);
  await client.connect();
  return client;
};

export const getDb = async (url: string): Promise<Db> => {
  const c = await getMongoClient(url);
  return c.db();
};

export const closeDb = async () => {
  if (client) {
    await client.close();
    client = null;
  }
};
```

Wire it up in your app startup:

```typescript
import { env } from "./config";
import { getDb, closeDb } from "./db";

const db = await getDb(env.MONGODB_URL);

// Graceful shutdown
process.on("SIGTERM", async () => {
  await closeDb();
  process.exit(0);
});
```

## Usage

```typescript
const users = db.collection("users");
await users.insertOne({ name: "Alice" });
const user = await users.findOne({ name: "Alice" });
```


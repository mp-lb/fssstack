# MongoDB extension

How to add MongoDB.

## Dependencies

```bash
pnpm --filter=<backend-or-shared-package> add mongodb
```

## Local development

Merge this into `zap.yaml`:

```yaml
ports: [MONGO_PORT]
docker:
  mongodb:
    aliases: [db]
    image: mongo:latest
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongodb-data:/data/db
```

Add `MONGODB_URL` to `.env.local` as `MONGODB_URL=mongodb://localhost:${MONGO_PORT}/<database-name>?directConnection=true`. The port will be assigned automatically by zapper.

## Code

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

### Usage

```typescript
const users = db.collection("users");
await users.insertOne({ name: "Alice" });
const user = await users.findOne({ name: "Alice" });
```

# BullMQ Background Jobs Setup

This guide covers setting up [BullMQ](https://docs.bullmq.io/) for background job processing in your application.

## Environment Variables

This extension adds the following environment variables:

Variable Services Secret Notes `REDIS_URL` backend, worker Yes Connection string to shared managed Redis `BULLBOARD_PORT` backend No Dev only, queue monitoring UI

After adding this extension, update:

- [docs/env-vars.md](../env-vars.md) - Add `REDIS_URL` to the registry
- [deployment-runbook.md](../deployment-runbook.md) - Add `REDIS_URL` to secrets table

## Architecture

### Components

1. **Queue** - Defines job queues and enqueues jobs
2. **Worker** - Standalone process that processes jobs from queues
3. **Bull Board** - Web UI for monitoring queues (development only)

### Queue Infrastructure in Shared System Package

BullMQ connection and queue definitions live in the shared system package since they're used across multiple services (backend, worker, etc).

**Important**: Following the config pattern (see [docs/env-vars.md](../env-vars.md)), apps validate environment variables with Zod and pass config to packages. Queues use lazy initialization to avoid circular dependencies.

**`packages/system/src/env.ts`** - Environment validation:

```
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URL: z.string().default("mongodb://localhost:27017/myapp"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

**`packages/system/src/queue.ts`** - Redis connection:

```
import Redis from "ioredis";
import { env } from "./env";

let queueConnection: Redis | null = null;

export const getQueueConnection = (): Redis => {
  if (!queueConnection) {
    queueConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,  // Required for BullMQ
      enableReadyCheck: true,
      ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
      ...(env.REDIS_USERNAME ? { username: env.REDIS_USERNAME } : {}),
    });
  }
  return queueConnection;
};

export const closeQueueConnection = async () => {
  if (queueConnection) {
    await queueConnection.quit();
    queueConnection = null;
  }
};
```

**`packages/system/src/queues.ts`** - Queue definitions (lazy initialization):

```
import { Queue } from "bullmq";
import { getQueueConnection } from "./queue";

let myQueue: Queue | null = null;

export const getMyQueue = (): Queue => {
  if (!myQueue) {
    myQueue = new Queue("myQueueName", {
      connection: getQueueConnection(),
    });
  }
  return myQueue;
};
```

**Why lazy initialization?** Calling `getQueueConnection()` at module initialization time can cause circular dependency issues. Using getter functions ensures the queue is only created when first accessed.

This centralized approach means:

- All services use the same queue instances
- Connection management is in one place
- Easy to add new queues accessible everywhere
- No circular dependency issues

## Setup Steps

### 1 Install Dependencies

Add to your shared system package:

```
pnpm add bullmq ioredis
```

Add to your backend (for Bull Board):

```
pnpm add @bull-board/api @bull-board/fastify
```

### 2 Add Environment Validation to System Package

Create `packages/system/src/env.ts`:

```
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URL: z.string().default("mongodb://localhost:27017/myapp"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

Export from `packages/system/src/index.ts`:

```
export { env } from "./env";
```

### 3 Add BullMQ to Shared System Package

Add to `packages/system/package.json`:

```
{
  "dependencies": {
    "bullmq": "^5.65.1",
    "ioredis": "^5.4.2",
    "zod": "^3.23.8"
  }
}
```

Create `packages/system/src/queue.ts`:

```
import Redis from "ioredis";
import { env } from "./env";

let queueConnection: Redis | null = null;

export const getQueueConnection = (): Redis => {
  if (!queueConnection) {
    queueConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
      ...(env.REDIS_USERNAME ? { username: env.REDIS_USERNAME } : {}),
    });
  }
  return queueConnection;
};

export const closeQueueConnection = async () => {
  if (queueConnection) {
    await queueConnection.quit();
    queueConnection = null;
  }
};
```

Create `packages/system/src/queues.ts` (using lazy initialization):

```
import { Queue } from "bullmq";
import { getQueueConnection } from "./queue";

let myQueue: Queue | null = null;

export const getMyQueue = (): Queue => {
  if (!myQueue) {
    myQueue = new Queue("myQueueName", {
      connection: getQueueConnection(),
    });
  }
  return myQueue;
};
```

**Critical**: Use lazy initialization (getter functions) for queues to avoid circular dependencies. Do not instantiate queues at module initialization time.

Export from `packages/system/src/index.ts`:

```
export { env } from "./env";
export { getQueueConnection, closeQueueConnection } from "./queue";
export { getMyQueue } from "./queues";
```

### 4 Create Worker Logic

Create `packages/<your-package>/src/queue/`:

**worker.ts** - Worker implementation

```
import { Worker, Job as BullJob } from "bullmq";
import { getQueueConnection, closeQueueConnection, getMyQueue } from "@your-org/system";

export interface MyJobData {
  // Define your job data structure
}

let worker: Worker | null = null;

export const startWorker = async (): Promise<Worker> => {
  if (worker) {
    console.log("⚠️ Worker already started");
    return worker;
  }

  const myQueue = getMyQueue();

  worker = new Worker<MyJobData>(
    myQueue.name,
    async (job: BullJob<MyJobData>) => {
      // Process job here
      console.log(`⚡ Processing job ${job.id}`);
      // Your job logic
      return { success: true };
    },
    {
      connection: getQueueConnection(),
      concurrency: 5,
      lockDuration: 60000,
      stalledInterval: 30000,
    },
  );

  worker.on("completed", (job) => {
    console.log(`✔ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`✘ Job ${job?.id} failed:`, err.message);
  });

  console.log("🚀 Worker started");
  return worker;
};

export const stopWorker = async (): Promise<void> => {
  if (!worker) return;
  console.log("🛑 Stopping worker...");
  await worker.close();
  await closeQueueConnection();
  worker = null;
  console.log("✅ Worker stopped");
};
```

### 5 Create Worker App

Create `apps/worker/`:

**package.json**

```
{
  "name": "@your-org/worker",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "@your-org/your-queue-package": "workspace:*",
    "tsx": "^4.20.6"
  }
}
```

**src/index.ts**

```
import { startWorker, stopWorker } from "@your-org/your-queue-package";

const main = async () => {
  console.log("🔧 Starting worker process...");
  try {
    await startWorker();
    console.log("✅ Worker is ready");
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  console.log(`\n📥 Received ${signal}, shutting down...`);
  await stopWorker();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main();
```

### 6 Add Bull Board (Development UI)

First, add to your backend's `config/env.ts`:

```
const envSchema = z.object({
  // ... existing vars
  BULLBOARD_PORT: z.string().transform(Number),
});
```

Create `apps/<backend-service>/src/bullboard.ts`:

```
import Fastify from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { getMyQueue } from "@your-org/system";
import { env, isProd } from "./config";

export const startBullBoard = async () => {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath("/");

  createBullBoard({
    queues: [new BullMQAdapter(getMyQueue())],
    serverAdapter,
  });

  const app = Fastify();
  await app.register(serverAdapter.registerPlugin(), { prefix: "/" });
  
  await app.listen({ 
    port: env.BULLBOARD_PORT, 
    host: isProd ? "0.0.0.0" : undefined 
  });
  
  console.log(`📊 Bull Board running at http://localhost:${env.BULLBOARD_PORT}`);
};
```

Add to your backend's main file (dev only):

```
if (!isProd) {
  const { startBullBoard } = await import("./bullboard");
  await startBullBoard();
}
```

### 7 Update Configuration

**Generate random port:**

```
node -e 'console.log(1024 + Math.floor(Math.random() * 8976))'
```

**Create `docs/bull.md`** with the Bull Board URL:

```
# Bull Board

Queue monitoring UI (development only): http://localhost:8949
```

**Update `zap.yaml`:**

Add `BULLBOARD_PORT` to ports array.

```
links:
  - name: bullboard
    url: http://localhost:${BULLBOARD_PORT}
native:
  worker:
    aliases: [w]
    cmd: pnpm --filter=@your-org/worker dev
    env: "*"
```

**Update `.github/workflows/deploy.yml`** to build the worker image, pass worker env vars, and include Upstash creds (if using the Redis extension):

```
# Optional but recommended if you use PRODUCTION_SECRETS
- name: Append production secrets
  env:
    PRODUCTION_SECRETS: ${{ secrets.PRODUCTION_SECRETS }}
  run: |
    echo "" >> .env.production
    if [ -z "$PRODUCTION_SECRETS" ]; then
      echo "::error::PRODUCTION_SECRETS secret is empty or not set"
      exit 1
    fi
    printf '%s\n' "$PRODUCTION_SECRETS" >> .env.production

- name: Build and Push Worker Docker Image
  run: |
    IMAGE="${{ env.GCP_REGION }}-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/${{ env.PROJECT_NAME }}/worker:${{ github.sha }}"
    docker build -t $IMAGE -f apps/worker/Dockerfile .
    docker push $IMAGE
    echo "WORKER_IMAGE=$IMAGE" >> $GITHUB_ENV

- name: Build worker env vars
  run: |
    set -a && source .env.production && set +a
    JSON=$(jq -n \
      --arg databaseUrl "${DATABASE_URL:-}" \
      --arg mongodbUrl "${MONGODB_URL:-}" \
      '{DATABASE_URL: $databaseUrl, MONGODB_URL: $mongodbUrl} | with_entries(select(.value != ""))')
    echo "WORKER_ENV=$JSON" >> $GITHUB_ENV

# In Terraform Apply, include:
# -var="worker_image=${{ env.WORKER_IMAGE }}"
# -var='worker_env=${{ env.WORKER_ENV }}'
# -var="upstash_email=${{ secrets.UPSTASH_EMAIL }}"   # if using Redis extension
# -var="upstash_api_key=${{ secrets.UPSTASH_API_KEY }}" # if using Redis extension

- name: Restart worker VM
  run: |
    gcloud compute instances reset "${{ env.PROJECT_NAME }}-worker" \
      --zone="${{ env.GCP_REGION }}-a" \
      --project="${{ secrets.GCP_PROJECT_ID }}" \
      --quiet

```

## Infrastructure (Terraform)

Workers need to run 24/7. We use **GCE e2-micro** instead of Cloud Run because:

- **Free tier**: 1 e2-micro instance per account in `us-central1`
- **Always-on**: No cold starts, no per-request pricing
- Cloud Run's mininstance=1 costs ~$17+/month; GCE e2-micro is free

### Prerequisites

- **Redis**: Follow [redis.md](./redis.md) to set up Redis first. The worker needs `REDIS_URL` to connect to the queue.

### Worker VM

Create `infra/worker.tf`:

```
locals {
  worker_image = var.worker_image != "" ? var.worker_image : "gcr.io/cloudrun/hello"
}

resource "google_compute_instance" "worker" {
  name         = "${var.project_name}-worker"
  machine_type = "e2-micro"
  zone         = "${var.gcp_region}-a"

  boot_disk {
    initialize_params {
      image = "cos-cloud/cos-stable"  # Container-Optimized OS
      size  = 10
    }
  }

  network_interface {
    network = "default"
    access_config {}  # Gives ephemeral public IP
  }

  metadata = {
    gce-container-declaration = yamlencode({
      spec = {
        containers = [{
          image = local.worker_image
          env = [
            { name = "REDIS_URL", value = var.redis_url },
            { name = "NODE_ENV", value = "production" },
            { name = "APP_ENV", value = "production" },
            # Other worker env vars passed from CI:
            # { name = "MONGODB_URL", value = var.worker_env["MONGODB_URL"] },
            # { name = "DATABASE_URL", value = var.worker_env["DATABASE_URL"] },
          ]
        }]
        restartPolicy = "Always"
      }
    })
  }

  service_account {
    scopes = ["cloud-platform"]
  }

  tags = ["worker"]

  labels = {
    container-vm = "cos-stable"
  }
}

resource "google_compute_firewall" "worker_ssh" {
  name    = "${var.project_name}-worker-ssh"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["worker"]
}

```

This uses **Container-Optimized OS** which:

- Runs your Docker image automatically on boot
- Restarts the container if it crashes (`restartPolicy: Always`)
- Auto-updates the OS for security patches

Add to `infra/variables.tf`:

```
variable "worker_image" {
  description = "Worker Docker image from Artifact Registry"
  type        = string
  default     = ""
}

variable "worker_env" {
  description = "Worker environment variables from CI"
  type        = map(string)
  default     = {}
}

```

**Note**: `var.redis_url` comes from the Redis extension. If you followed [redis.md](./redis.md), you can reference the Upstash output directly:

```
{ name = "REDIS_URL", value = "rediss://default:${upstash_redis_database.main.password}@${upstash_redis_database.main.endpoint}:${upstash_redis_database.main.port}" }

```

### Worker Dockerfile

Create `apps/worker/Dockerfile`:

```
FROM node:20-slim
WORKDIR /app

RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/
COPY etc/ ./etc/

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@your-org/worker

CMD ["pnpm", "--filter=@your-org/worker", "start"]

```

### Deploying Updates

To update the worker after a new image is pushed, run Terraform with the new  
`worker_image`, then reset the VM:

```
terraform apply -var="worker_image=${WORKER_IMAGE}"

gcloud compute instances reset "${PROJECT_NAME}-worker" \
  --zone="${GCP_REGION}-a" \
  --project="${GCP_PROJECT_ID}" \
  --quiet

```

Terraform updates the Container-Optimized OS `gce-container-declaration` metadata  
in place, but the already-running container can keep using the old image until  
the VM restarts. Resetting the VM after Terraform applies makes COS start the  
worker from the updated declaration.

If the VM is unhealthy or you need a clean replacement, recreate the instance  
(causes brief downtime):

```
terraform taint google_compute_instance.worker
terraform apply

```

SSH is still useful for debugging, but do not rely on a manual `docker pull` as  
the normal deploy path. Keep the deployed image in Terraform so future applies  
do not drift from the running worker.

### Cost Comparison

Option Monthly Cost GCE e2-micro (free tier) **$0** GCE e2-micro (non-free region) ~$6 Cloud Run min=1 ~$17+

If you're using the Redis extension, pass `upstash_email` and `upstash_api_key` in `.github/workflows/deploy.yml` so Terraform can create Redis and set `REDIS_URL` for backend + worker.

## Usage Patterns

### Enqueue a Job

```
import { getMyQueue } from "@your-org/system";

await getMyQueue().add("job-name", {
  // job data
});

```

### With Options

```
import { getMyQueue } from "@your-org/system";

await getMyQueue().add("job-name", jobData, {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
});

```

## Worker Configuration

```
{
  connection: getQueueConnection(),
  concurrency: 5,           // Process N jobs simultaneously
  lockDuration: 60000,      // Max time (ms) to complete a job
  stalledInterval: 30000,   // Check for stalled jobs interval
}

```

- **Concurrency**: Higher for I/O-bound jobs, lower for CPU-bound
- **Lock duration**: Increase for long-running jobs
- **Stalled interval**: How often to check if a worker died mid-job

## Best Practices

1. **Keep jobs idempotent** - Jobs may retry, ensure safe re-execution
2. **Use descriptive job names** - Makes debugging easier
3. **Add job metadata** - Include IDs, timestamps for tracing
4. **Monitor queue depth** - Alert on backlog growth
5. **Set appropriate timeouts** - Prevent infinite jobs
6. **Clean up completed jobs** - Use `removeOnComplete: true`
7. **Separate by priority** - Create different queues for critical vs. background tasks

## Development Commands

```
zap start worker     # Start worker
zap logs worker      # View logs
zap ps              # Check status

```

## Monitoring

- **Bull Board**: Visual queue monitoring (dev only)
- **Logs**: Check worker logs for job processing
- **Redis**: Monitor queue depth in Redis

## Adding New Job Types

1. Define job data interface in `worker.ts`
2. Create new queue in `queues.ts`
3. Add worker handler in `startWorker` function
4. Register queue with Bull Board
5. Export queue from package index

## Troubleshooting

### Jobs not processing

- Verify worker is running
- Check Redis connection
- View Bull Board for job status

### Jobs failing

- Check worker logs for errors
- Verify environment variables
- Test job handler in isolation

### Connection issues

- Ensure `maxRetriesPerRequest: null` is set
- Verify Redis URL is correct
- Check for connection leaks on shutdown


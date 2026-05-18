# Redis Setup (Upstash)

This guide covers setting up managed Redis using [Upstash](https://upstash.com/) — a serverless Redis with a generous free tier.

## Why Upstash

For low-traffic apps, Upstash is effectively free. For high-traffic, it's pay-per-request ($0.2/100k commands).

## Environment Variables

After adding this extension, update:

- [env-vars.md](../platform/env-vars.md) - Add `REDIS_URL` to the registry
- [deployment-runbook.md](../platform/deployment-runbook.md) - Add `REDIS_URL` to secrets table

## Infrastructure (Terraform)

### 1. Add Upstash Provider

Update `infra/main.tf`:

```hcl
terraform {
  required_providers {
    # ... existing providers
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
  }
}

provider "upstash" {
  email   = var.upstash_email
  api_key = var.upstash_api_key
}
```

### 2. Create Redis Database

Create `infra/redis.tf`:

```hcl
resource "upstash_redis_database" "main" {
  database_name  = "${var.project_name}-redis"
  region         = "global"
  primary_region = "us-east-1"  # Global database with primary in US East
  tls            = true
}

output "redis_url" {
  value     = "rediss://default:${upstash_redis_database.main.password}@${upstash_redis_database.main.endpoint}:${upstash_redis_database.main.port}"
  sensitive = true
}
```

### 3. Add Variables

Add to `infra/variables.tf`:

```hcl
variable "upstash_email" {
  description = "Upstash account email"
  type        = string
}

variable "upstash_api_key" {
  description = "Upstash API key"
  type        = string
  sensitive   = true
}
```

### 4. Get Upstash Credentials

1. Sign up at [console.upstash.com](https://console.upstash.com/)
2. Go to **Account** → **Management API**
3. Create an API key
4. Add to your secrets:
  - `UPSTASH_EMAIL` - Your Upstash account email
  - `UPSTASH_API_KEY` - The API key you created
  - `UPSTASH_REDIS_URL` - Optional override if your account already has a Redis DB (use the full `rediss://` URL)

### 5. Pass Upstash creds to Terraform in CI

Update `.github/workflows/deploy.yml` to pass the Upstash secrets when running `terraform apply`:

```yaml
-var="upstash_email=${{ secrets.UPSTASH_EMAIL }}"
-var="upstash_api_key=${{ secrets.UPSTASH_API_KEY }}"
-var="redis_url_override=${{ secrets.UPSTASH_REDIS_URL }}"
```

### 6. Pass Redis URL to Services

The `redis_url` output can be passed to other Terraform resources:

```hcl
# Example: Pass to Cloud Run backend
resource "google_cloud_run_v2_service" "backend" {
  template {
    containers {
      env {
        name  = "REDIS_URL"
        value = upstash_redis_database.main.endpoint != "" ? "rediss://default:${upstash_redis_database.main.password}@${upstash_redis_database.main.endpoint}:${upstash_redis_database.main.port}" : ""
      }
    }
  }
}

# Example: Pass to GCE worker
resource "google_compute_instance" "worker" {
  metadata = {
    gce-container-declaration = yamlencode({
      spec = {
        containers = [{
          env = [
            {
              name  = "REDIS_URL"
              value = "rediss://default:${upstash_redis_database.main.password}@${upstash_redis_database.main.endpoint}:${upstash_redis_database.main.port}"
            }
          ]
        }]
      }
    })
  }
}
```

**Note:** When Redis is provisioned by Terraform (Upstash), you typically do **not** set `REDIS_URL` in `PRODUCTION_SECRETS`. Terraform injects it into Cloud Run and the worker. Keep `REDIS_URL` in `.env.local` for local development only.

## Local Development

For local development, run Redis in Docker.

Add to `zap.yaml`:

```yaml
docker:
  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
```

Add to `.env.local`:

```bash
REDIS_URL=redis://localhost:6379
```

## Usage in Code

### Connection Setup

Create `packages/server/src/redis.ts`:

```typescript
import Redis from "ioredis";

let redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return redis;
};

export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};
```

### Basic Operations

```typescript
import { getRedis } from "@your-org/server";

const redis = getRedis();

// String
await redis.set("key", "value");
await redis.get("key");

// With expiry (seconds)
await redis.setex("session:123", 3600, JSON.stringify(data));

// Hash
await redis.hset("user:1", { name: "Alice", email: "alice@example.com" });
await redis.hgetall("user:1");

// List (queue)
await redis.lpush("queue", JSON.stringify(job));
await redis.rpop("queue");
```

## Pricing

For most side projects, the free tier is plenty. A typical page load might use 5-10 Redis commands for caching/sessions.

## Monitoring

Upstash console provides:

- Command count and latency graphs
- Memory usage
- Slow query logs

Access at [console.upstash.com](https://console.upstash.com/).
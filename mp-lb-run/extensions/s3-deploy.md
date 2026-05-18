# S3 Deployment

Use this after installing the S3 app extension.

## Bucket

Create a private object storage bucket.

For AWS S3:

- block public access
- configure CORS if browsers upload directly
- create credentials with least-privilege access to the bucket

## Environment

Add non-secret values to `.env.production`:

```bash
AWS_REGION=us-east-1
AWS_S3_BUCKET=<bucket-name>
```

Add secrets to `secrets.enc.json`:

```json
{
  "AWS_ACCESS_KEY_ID": "...",
  "AWS_SECRET_ACCESS_KEY": "..."
}
```

Do not set `AWS_ENDPOINT_URL` for AWS S3 unless using an S3-compatible provider that requires it.

## Verify

Deploy and test upload/download from the deployed backend.


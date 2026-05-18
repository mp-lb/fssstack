# S3 Deployment

Use this after installing the S3 app extension.

## Bucket creation

The user needs to make sure a bucket exists.

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

## For the user

Ask the user to make sure to add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to `secrets.enc.json`.

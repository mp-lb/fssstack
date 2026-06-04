# S3 Deployment

Use this after installing the S3 app extension.

## Production bucket setup

Production uses one real AWS S3 bucket per application in Singapore, `ap-southeast-1`.

Name buckets after the application backend, usually:

```bash
someproject-backend
```

Use lowercase bucket names without underscores. Bucket names are globally unique, so add a suffix only if the simple project name is unavailable.

The standard setup is:

1. Create a private S3 bucket in `ap-southeast-1`.
2. Block public access.
3. Add CORS if browsers upload or download directly with presigned URLs.
4. Create one IAM policy for read/write object access.
5. Create one IAM user for the application.
6. Attach the policy to the user.
7. Create an access key and secret for the user.
8. Store the bucket name and credentials in the app environment.

Use folder prefixes inside the bucket when the app needs different logical areas. Do not create separate buckets just to organize files.

## CLI setup

Set shell variables for the bucket, IAM user, policy, and frontend origin:

```bash
export AWS_REGION=ap-southeast-1
export S3_BUCKET=someproject-backend
export S3_IAM_USER=someproject-s3
export S3_POLICY_NAME=someproject-s3-read-write
export FRONTEND_ORIGIN=https://app.example.com
```

Create the bucket:

```bash
aws s3api create-bucket \
  --bucket "$S3_BUCKET" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"
```

Block public access:

```bash
aws s3api put-public-access-block \
  --bucket "$S3_BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Configure CORS for presigned browser uploads or downloads:

```bash
cat > /tmp/s3-cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD", "PUT"],
      "AllowedOrigins": ["$FRONTEND_ORIGIN"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 300
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket "$S3_BUCKET" \
  --cors-configuration file:///tmp/s3-cors.json
```

Create the IAM user:

```bash
aws iam create-user --user-name "$S3_IAM_USER"
```

Create the standard app bucket policy:

```bash
cat > /tmp/s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads"
      ],
      "Resource": "arn:aws:s3:::$S3_BUCKET"
    },
    {
      "Sid": "ReadWriteObjects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF
```

Attach it:

```bash
POLICY_ARN="$(
  aws iam create-policy \
    --policy-name "$S3_POLICY_NAME" \
    --policy-document file:///tmp/s3-policy.json \
    --query 'Policy.Arn' \
    --output text
)"

aws iam attach-user-policy \
  --user-name "$S3_IAM_USER" \
  --policy-arn "$POLICY_ARN"
```

Create access credentials:

```bash
aws iam create-access-key \
  --user-name "$S3_IAM_USER"
```

Copy the returned `AccessKeyId` and `SecretAccessKey` once. AWS will not show the secret again.

## Environment

Add non-secret values to `.env.production`:

```bash
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=someproject-backend
```

## For the user

Ask the user to make sure to add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to `secrets.json.enc`.

Do not set `AWS_ENDPOINT_URL` in production.

## Verify credentials

Use a temporary AWS CLI profile so the app user's key can be tested without replacing the developer's main profile:

```bash
aws configure set aws_access_key_id "<access-key-id>" --profile s3-check
aws configure set aws_secret_access_key "<secret-access-key>" --profile s3-check
aws configure set region "$AWS_REGION" --profile s3-check

printf "s3 check\n" > /tmp/s3-check.txt

aws s3 ls "s3://$S3_BUCKET" --profile s3-check
aws s3 cp /tmp/s3-check.txt "s3://$S3_BUCKET/check.txt" --profile s3-check
aws s3 cp "s3://$S3_BUCKET/check.txt" /tmp/s3-check-downloaded.txt --profile s3-check
diff /tmp/s3-check.txt /tmp/s3-check-downloaded.txt
aws s3 rm "s3://$S3_BUCKET/check.txt" --profile s3-check
```

The app credentials should be able to read, write, delete, list, and use presigned URLs. They should not be able to change bucket policy, change CORS, or access other buckets.

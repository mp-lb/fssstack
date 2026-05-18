# MongoDB Deployment

Use this after installing the MongoDB app extension.

## Database

Create a managed MongoDB database.

MongoDB Atlas is the usual default unless the deployment environment provides another managed MongoDB service.

## Environment

Add `MONGODB_URL` to `secrets.enc.json`.

Add `MONGODB_URL` to each backend `env` list in `fssstack.json`.

Rerun base setup if `deployment/apps.json` needs regeneration.

## Verify

Deploy and check backend logs for a successful MongoDB connection.

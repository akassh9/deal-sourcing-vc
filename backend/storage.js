import 'dotenv/config'; // Ensure environment variables are loaded
import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
const storage = new Storage();
const bucket = storage.bucket(bucketName);

export async function uploadFile(filePath, destination) {
  await bucket.upload(filePath, { destination });
}

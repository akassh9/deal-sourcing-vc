import { Storage } from '@google-cloud/storage';
import 'dotenv/config';

const bucketName = process.env.GOOGLE_CLOUD_BUCKET;
const storage = new Storage();
const bucket = storage.bucket(bucketName);

export async function uploadFile(filePath, destination) {
  await bucket.upload(filePath, { destination });
  return `gs://${bucketName}/${destination}`;
}

export async function generateSignedUrl(fileName) {
  try {
    const [url] = await bucket.file(fileName).getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return url;
  } catch (error) {
    console.error('❌ ERROR in generateSignedUrl:', error);
    throw error;
  }
}
import { ENV } from '@/config/env';
import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
	region: ENV.AWS_REGION,
	credentials: {
		accessKeyId: ENV.AWS_ACCESS_KEY_ID,
		secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
	},
});
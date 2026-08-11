import { ENV } from '@/config/env';
import { s3Client } from './client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * This function generate a singed url for frontend to upload images directly from frontend
 * @param fileName name of the file
 * @param fileType type of file
 * @returns return url and the public url
 */

export const generatePresignedUrl = async (fileName: string, fileType: string) => {
	const key = `market-thumbnails/${Date.now()}-${fileName}`;

	const command = new PutObjectCommand({
		Bucket: ENV.AWS_S3_BUCKET,
		Key: key,
		ContentType: fileType,
	});

	const url = await getSignedUrl(s3Client, command, {
		expiresIn: 60 * 2,
	});

	const publicUrl = `https://${ENV.AWS_S3_BUCKET}.s3.${ENV.AWS_REGION}.amazonaws.com/${key}`;

	return { url, publicUrl };
};

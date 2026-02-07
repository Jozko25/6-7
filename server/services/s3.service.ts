import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured");
  }

  // Sanitize filename: replace spaces and special characters
  const sanitizedFileName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `vehicles/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return the public URL (assumes bucket is public or has proper policy)
  const region = process.env.AWS_REGION || "us-east-1";
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export async function getUploadUrl(
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured");
  }

  // Sanitize filename: replace spaces and special characters
  const sanitizedFileName = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `vehicles/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // Generate pre-signed URL for client-side upload
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  // Return the URL - use CloudFront if configured, otherwise S3
  let fileUrl: string;
  if (process.env.CLOUDFRONT_URL) {
    fileUrl = `${process.env.CLOUDFRONT_URL}/${key}`;
  } else {
    const region = process.env.AWS_REGION || "us-east-1";
    fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  return { uploadUrl, fileUrl };
}

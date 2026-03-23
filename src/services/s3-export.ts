import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export interface S3ExportOptions {
  bucket: string;
  key: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  contentType: string;
}

/**
 * Upload a buffer to an S3-compatible bucket.
 * Supports AWS S3, Wasabi, MinIO, DigitalOcean Spaces, etc.
 */
export async function exportToS3(
  buffer: Buffer,
  options: S3ExportOptions,
): Promise<{ url: string }> {
  const {
    bucket,
    key,
    region = "us-east-1",
    accessKeyId,
    secretAccessKey,
    endpoint,
    contentType,
  } = options;

  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };

  if (endpoint) {
    clientConfig.endpoint = endpoint;
    clientConfig.forcePathStyle = true;
  }

  const client = new S3Client(clientConfig);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const baseUrl = endpoint || `https://${bucket}.s3.${region}.amazonaws.com`;
  const url = endpoint
    ? `${endpoint}/${bucket}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { url };
}

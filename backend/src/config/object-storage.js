const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3")
const config = require("./env")

const client = new S3Client({
  endpoint: config.storage.endpoint,
  region: config.storage.region,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
})

async function bodyToBuffer(body) {
  if (Buffer.isBuffer(body)) return body
  if (body instanceof Uint8Array) return Buffer.from(body)

  const chunks = []
  for await (const chunk of body) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function putObject(key, body, contentType, metadata = {}) {
  await client.send(new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  }))
}

async function getObject(key) {
  const result = await client.send(new GetObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
  }))
  return bodyToBuffer(result.Body)
}

async function deleteObject(key) {
  await client.send(new DeleteObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
  }))
}

module.exports = { putObject, getObject, deleteObject }
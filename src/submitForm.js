const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");


// Initialize clients — these are reused across warm Lambda invocations
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

// Standard response helper — keeps code DRY
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Required for CORS
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, email, message, fileName, fileType } = body;

    // Basic validation
    if (!name || !email || !message) {
      return response(400, { error: "name, email, and message are required" });
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    // Build the DynamoDB item
    const item = {
      id,
      name,
      email,
      message,
      createdAt,
      // Only add file info if a file is being uploaded
      ...(fileName && { fileName, fileKey: `uploads/${id}/${fileName}` }),
    };

    // Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: item,
      })
    );

    // If a file upload was requested, generate a pre-signed S3 URL
    // This lets the client upload directly to S3 (faster, no Lambda memory limits)
    let uploadUrl = null;
    if (fileName && fileType) {
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `uploads/${id}/${fileName}`,
        ContentType: fileType,
      });
      // URL expires in 5 minutes — enough time for the client to upload
      uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    }

    return response(201, {
      message: "Submission saved successfully",
      id,
      uploadUrl, // Frontend uses this to PUT the file directly to S3
    });
  } catch (err) {
    console.error("submitForm error:", err);
    return response(500, { error: "Internal server error" });
  }
};
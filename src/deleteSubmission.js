const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    // API Gateway puts path params in event.pathParameters
    const { id } = event.pathParameters;

    // First fetch the record so we know if there's a file to delete
    const existing = await docClient.send(
      new GetCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id },
      })
    );

    if (!existing.Item) {
      return response(404, { error: "Submission not found" });
    }

    // If there was an attached file, delete it from S3 first
    if (existing.Item.fileKey) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: existing.Item.fileKey,
        })
      );
    }

    // Now delete from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id },
      })
    );

    return response(200, { message: "Submission deleted", id });
  } catch (err) {
    console.error("deleteSubmission error:", err);
    return response(500, { error: "Internal server error" });
  }
};
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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
    const result = await docClient.send(
      new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE,
      })
    );

    return response(200, {
      count: result.Count,
      submissions: result.Items,
    });
  } catch (err) {
    console.error("getSubmissions error:", err);
    return response(500, { error: "Internal server error" });
  }
};
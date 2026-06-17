# Serverless Contact Form API

A production-ready REST API built with AWS Lambda, API Gateway, DynamoDB, and S3.
Deployed via the Serverless Framework with GitHub Actions CI/CD.

## Architecture

Client → API Gateway → Lambda → DynamoDB (form data)
                              → S3 (file uploads via pre-signed URLs)

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /submit | Submit a form (+ get S3 upload URL) |
| GET | /submissions | Get all submissions |
| DELETE | /submissions/{id} | Delete a submission + its file |

## Local Setup

npm install
npx serverless deploy --stage dev

## Example POST /submit

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!",
  "fileName": "resume.pdf",
  "fileType": "application/pdf"
}

## Response

{
  "message": "Submission saved successfully",
  "id": "abc-123",
  "uploadUrl": "https://s3.amazonaws.com/..." 
}

## CI/CD

Push to main branch → GitHub Actions automatically deploys to prod.
Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in GitHub Secrets.

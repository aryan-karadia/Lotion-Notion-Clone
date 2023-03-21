### TODO ###
## Adding lambda permissions for dynamodb ##

terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

# specify the provider region
provider "aws" {
  region = "ca-central-1"
}

# the locals block is used to declare constants that 
# you can use throughout your code
locals {
  save_function_name   = "save-note-30140288"
  delete_function_name = "delete-note-30140288"
  get_function_name    = "get-note-30140288"
  handler_name         = "main.lambda_handler"
  artifact_name        = "artifact.zip"
}

# create a role for the Lambda function to assume
# every service on AWS that wants to call other AWS services should first assume a role and
# then any policy attached to the role will give permissions
# to the service so it can interact with other AWS services
# see the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role
resource "aws_iam_role" "lambda" {
  name               = "iam-for-lambda"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# create a policy for logging
resource "aws_iam_policy" "logs_and_dynamodb" {
  name        = "lambda-logging-and-dynamodb"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dyanmodb:*"
      ],
      "Resource": ["arn:aws:logs:*:*:*", "${aws_dynamodb_table.notes.arn}"],
      "Effect": "Allow"
    }
  ]
}
EOF
}

# attach the logs policy to the function role
resource "aws_iam_role_policy_attachment" "lambda_logs_and_dynamodb" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.logs_and_dynamodb.arn
}

## DELETE LAMBDA ##

data "archive_file" "delete-lambda" {
  type        = "zip"
  source_file = "../functions/delete-note/main.py"
  output_path = "../functions/delete-note/artifact.zip"
}

resource "aws_lambda_function" "delete-lambda" {

  role             = aws_iam_role.lambda.arn
  function_name    = local.delete_function_name
  handler          = local.handler_name
  filename         = "../functions/delete-note/artifact.zip"
  source_code_hash = data.archive_file.delete-lambda.output_base64sha256

  runtime = "python3.9"
}


resource "aws_lambda_function_url" "delete-url" {
  function_name      = aws_lambda_function.delete-lambda.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

output "delete-lambda_url" {
  value = aws_lambda_function_url.delete-url.function_url
}

## SAVE LAMBDA ##

data "archive_file" "save-lambda" {
  type        = "zip"
  source_file = "../functions/save-note/main.py"
  output_path = "../functions/save-note/artifact.zip"
}

resource "aws_lambda_function" "save-lambda" {

  role             = aws_iam_role.lambda.arn
  function_name    = local.save_function_name
  handler          = local.handler_name
  filename         = "../functions/save-note/artifact.zip"
  source_code_hash = data.archive_file.save-lambda.output_base64sha256

  runtime = "python3.9"
}

resource "aws_lambda_function_url" "save-url" {
  function_name      = aws_lambda_function.save-lambda.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

output "save-lambda_url" {
  value = aws_lambda_function_url.save-url.function_url
}

## GET LAMBDA ##

data "archive_file" "get-lambda" {
  type        = "zip"
  source_file = "../functions/get-notes/main.py"
  output_path = "../functions/get-notes/artifact.zip"
}

resource "aws_lambda_function" "get-lambda" {

  role             = aws_iam_role.lambda.arn
  function_name    = local.get_function_name
  handler          = local.handler_name
  filename         = "../functions/get-notes/artifact.zip"
  source_code_hash = data.archive_file.get-lambda.output_base64sha256

  runtime = "python3.9"
}

resource "aws_lambda_function_url" "get-url" {
  function_name      = aws_lambda_function.get-lambda.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

output "get-lambda_url" {
  value = aws_lambda_function_url.get-url.function_url
}

# read the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dynamodb_table
resource "aws_dynamodb_table" "notes" {
  name         = "notes-30148859"
  billing_mode = "PROVISIONED"

  # up to 8KB read per second (eventually consistent)
  read_capacity = 1

  # up to 1KB per second
  write_capacity = 1

  # the hash_key is the partition key
  hash_key = "email"
  # the range_key is the sort key
  range_key = "id"

  # the hash_key data type is string
  attribute {
    name = "email"
    type = "S"
  }
  # the range_key data type is string
  attribute {
    name = "id"
    type = "S"
  }
}
import boto3
import json
import requests

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('lotion-30148859')

def lambda_handler(event, context):
    http_method = event["requestContext"]["http"]["method"]
    print(event)
    if http_method == "POST":
        body = json.loads(event['body'])
        access_token = event['headers']['access-token']
        # if no access token, return 401
        if not access_token:
            return {
                'statusCode': 401,
                'body': json.dumps({
                'message': 'Unauthorized'
                })
            }
        # if access token, get email from google
        google_headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }
        # if access token is invalid, return 401
        response = requests.get("https://people.googleapis.com/v1/people/me?personFields=emailAddresses", headers=google_headers)
        if response.status_code == 401:
        # Return a 401 Unauthorized response if the access token is invalid
            return {
                "statusCode": 401,
                "body": "Unauthorized",
            }
        
        googleData = json.loads(response.text)
        print(googleData)
        # if email from google is not equal to email from request body, return 401
        GoogleEmail = googleData["emailAddress"][0]["value"]
        if GoogleEmail != body["email"]:
            return {
                'statusCode': 401,
                'body': json.dumps({
                'message': 'Unauthorized'
                })
            }
        try:
            table.put_item(Item=body)
            return {
                'statusCode': 200,
                'body': json.dumps({
                'message': 'save note success'
                })
            }
        except Exception as e:
            print(f"Exception: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                'message': "custom error" + str(e)
                })
            }
    else:
        return {
            'statusCode': 405,
            'body': json.dumps({
            'message': 'Method Not Allowed'
            })
            }

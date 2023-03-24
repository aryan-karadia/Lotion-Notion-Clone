import boto3
import json
import requests

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('lotion-30148859')

def lambda_handler(event, context):
    body = json.loads(event['body'])
    email = event['headers']['email']
    access_token = event['headers']['access-token']
    id = body['id']
    if not access_token:
        return {
            'statusCode': 401,
            'body': json.dumps({
            'message': 'Unauthorized'
            })
        }
    google_headers = {
    "Authorization": f"Bearer {access_token}",
    "Accept": "application/json",
    }
    response = requests.get("https://people.googleapis.com/v1/people/me?personFields=emailAddresses", headers=google_headers)
    if response.status_code == 401:
    # Return a 401 Unauthorized response if the access token is invalid
        return {
            "statusCode": 401,
            "body": "Unauthorized",
        }
    googleData = json.loads(response.text)
    print(googleData)
    GoogleEmail = googleData["emailAddress"][0]["value"]
    if GoogleEmail != body["email"]:
        return {
            'statusCode': 401,
            'body': json.dumps({
            'message': 'Unauthorized'
            })
        }
    try:
        table.delete_item(Key={'email': email, 'id': id})
        return {
            'statusCode': 200,
            'body': json.dumps({
            'message': 'delete note success'
            })
        }
    except Exception as e:
        print(f"Exception: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
            'message': str(e)
            })
        }
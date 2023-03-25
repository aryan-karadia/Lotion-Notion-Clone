import boto3
import json
from boto3.dynamodb.conditions import Key
import requests

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('lotion-30148859')

def lambda_handler(event, context):
    http_method = event["requestContext"]["http"]["method"]
    body = json.loads(event['body'])
    print(event)
    if http_method == "GET": 
        try:
            email = event['headers']['email']
            access_token = event['headers']['access-token']
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
            response = table.query(KeyConditionExpression=Key('email').eq(email))
            print(response)
            if not access_token:
                return {
                    'statusCode': 401,
                    'body': json.dumps({
                    'message': 'Unauthorized'
                    })
                }
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'notes': response['Items'],
                    'count': len(response['Items']),
                'message': 'get note success'
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
    else:
        return {
            'statusCode': 405,
            'body': json.dumps({
            'message': 'Method Not Allowed'
            })
            }
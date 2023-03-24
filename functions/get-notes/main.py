import boto3
import json
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('lotion-30148859')

def lambda_handler(event, context):
    http_method = event["requestContext"]["http"]["method"]
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
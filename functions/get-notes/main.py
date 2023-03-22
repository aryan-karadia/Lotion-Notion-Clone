import boto3
import json
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('notes')
        email = event['headers']['email']
        access_token = event['headers']['Authorization']
        response = table.query(KeyConditionExpression=Key('email').eq(email))
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

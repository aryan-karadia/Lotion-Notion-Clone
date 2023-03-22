import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('notes')

def lambda_handler(event, context):
    body = json.loads(event['body'])
    email = event['headers']['email']
    access_token = event['headers']['Authorization']
    id = body['id']
    if not access_token:
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
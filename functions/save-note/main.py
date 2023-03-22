import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('notes')

def lambda_handler(event, context):
    body = json.load(event['body'])
    email = body['email']
    id = body['id']
    noteBody = body['body']
    title = body['title']
    when = body['when']
    access_token = event['headers']['Authorization']
    if not access_token:
        return {
            'statusCode': 401,
            'body': json.dumps({
            'message': 'Unauthorized'
            })
        }
    try:

        table.put_item(Item={'email': email, 'id': id, 'access_token': access_token, 'body': noteBody, 'title': title, 'when': when})
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
            'message': str(e)
            })
        }

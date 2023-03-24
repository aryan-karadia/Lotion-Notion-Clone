import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('lotion-30148859')

def lambda_handler(event, context):
    http_method = event["requestContext"]["http"]["method"]
    if http_method == "POST":
        body = json.loads(event['body'])
        access_token = event['headers']['Access-token']
        if not access_token:
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

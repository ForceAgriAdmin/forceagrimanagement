import boto3
import json

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition', region_name='eu-west-1')
dynamodbTableName = 'forceagriworkers'
dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
employeeTable = dynamodb.Table(dynamodbTableName)
bucketName = 'workerauthbucket'

def lambda_handler(event, context):
    print(event)
    objectKey = event['queryStringParameters']['objectKey']
    image_bytes = s3.get_object(Bucket=bucketName,Key=objectKey)['Body'].read()
    response = rekognition.search_faces_by_image(
        CollectionId="workers",
        Image={'Bytes':image_bytes}
    )

    for match in response['FaceMatches']:
        print(match['Face']['FaceId'],match['Face']['Confidence'])

        face = employeeTable.get_item(
            Key = {
                'rekognitionId': match['Face']['FaceId']
            }
        )
        if 'Item' in face:
            print('Worker Found: ', face['Item'])
            return buildResponse(200,{
                'Message': 'Success',
                'workerId': face['Item']['workerId']
            })
        print('Worker not found')
        return buildResponse(403,{'Message':'Failed'})
        

def buildResponse(statusCode, body=None):
    response = {
        'statusCode': statusCode,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }
    if body is not None:
        response['body'] = json.dumps(body)
    return response
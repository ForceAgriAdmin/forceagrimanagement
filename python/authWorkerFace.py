import boto3
import json

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition', region_name='eu-west-1')
dynamodbTableName = 'forceagriworkers'
dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
employeeTable = dynamodb.Table(dynamodbTableName)
bucketName = 'workerauthbucket'

def lambda_handler(event, context):
    try:
        print(event)
        objectKey = event['queryStringParameters']['objectKey']
        image_bytes = s3.get_object(Bucket=bucketName, Key=objectKey)['Body'].read()

        response = rekognition.search_faces_by_image(
            CollectionId="workers",
            Image={'Bytes': image_bytes}
        )

        for match in response.get('FaceMatches', []):
            face_id = match['Face']['FaceId']
            confidence = match['Face']['Confidence']
            print(f"Match: {face_id} @ {confidence}%")

            face = employeeTable.get_item(Key={'rekognitionId': face_id})
            if 'Item' in face:
                print('Worker Found:', face['Item'])
                return build_response(200, {
                    'Message': 'success',
                    'workerId': face['Item']['workerId']
                })

        print('Worker not found')
        return build_response(404, {'Message': 'no_match'})

    except rekognition.exceptions.InvalidParameterException as e:
        print('Rekognition error: No face found')
        return build_response(502, {'Message': 'no_face_detected'})
    except Exception as e:
        print('Unhandled error:', str(e))
        return build_response(502, {'Message': 'error', 'error': str(e)})

def build_response(statusCode, body=None):
    return {
        'statusCode': statusCode,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body or {})
    }

import boto3

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition', region_name='eu-west-1')
dynamodbTableName = 'forceagriworkers'
dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
employeeTable = dynamodb.Table(dynamodbTableName)

def lamda_handler(event, context):
    print(event)
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    try:
        response = index_employee_image(bucket,key)
        print(response)
        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            faceId = response['FaceRecords'][0]['Face']['FaceId']
            workerId = key.split('.', 1)[0]
            register_worker(faceId,workerId)
    except Exception as e:
        print(e)
        print('Error processing worker image {} from bucket{}',format(key,bucket))
        raise e

def index_employee_image(bucket,key):
    response = rekognition.index_faces(
        Image={
            'S3Object':
            {
                'Bucket': bucket,
                'Name': key
            }
        },
        CollectionId='workers'
    )
    return response

def register_worker(faceId,workerId):
    employeeTable.put_item(
        Item={
            'rekognitionId': faceId,
            'workerId': workerId
        }
    )
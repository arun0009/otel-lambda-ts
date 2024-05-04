import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoDBClient = new DynamoDBClient({ endpoint: 'http://localstack:4566', region: 'us-east-1' });

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const params = {
            TableName: 'items',
            Item: {
                'id': { S: '1000' },
                'itemName': { S: 'Tesla' },
                'location': { S: 'San Francisco' },
            },
        };
        
        const putItemCommand = new PutItemCommand(params);
        
        await dynamoDBClient.send(putItemCommand);

        const message = 'Item inserted into DynamoDB table successfully';

        return {
            statusCode: 200,
            body: JSON.stringify({ message }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
}

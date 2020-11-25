const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function listItemTypes(userId: String) {
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }
    try {
        const data = await docClient.query(params).promise();
        return data.Items.map((item: any) => {
          const { userId, ...rest } = item;
          return rest;
        });
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default listItemTypes;
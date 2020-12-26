const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function clientListActionsFuture() {
    const dateNow = new Date();
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      IndexName : "actionIdIndex",
      ExpressionAttributeValues: {
        ":v1": 'Action',
        ":v2": dateNow.toISOString()
      },
      ExpressionAttributeNames: {
        "#entityType": "entityType",
        "#dateActionStart": "dateActionStart"
      },
      KeyConditionExpression: "#entityType = :v1 AND #dateActionStart >= :v2"
    }
    try {
        const data = await docClient.query(params).promise();
        return data.Items;
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default clientListActionsFuture;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function list(entityType: String, userId: String, prefix?: string) {
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      ExpressionAttributeValues: {
        ":v1": userId,
        ":v2": (prefix ? prefix : '') + entityType.toLowerCase() + ':'
      },
      ExpressionAttributeNames: {
        "#userId": "userId",
        "#id": "id"
      },
      KeyConditionExpression: "#userId = :v1 AND begins_with(#id, :v2)"
    }
    try {
        const data = await docClient.query(params).promise();
        return data.Items.map((one: any) => {
          const { userId, ...rest } = one;
          return rest;
        });
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default list;
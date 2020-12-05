const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function listById(itemId: string, userId: string) {
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      IndexName : "itemIdIndex",
      ExpressionAttributeValues: {
        ":v1": userId,
        ":v2": itemId
      },
      ExpressionAttributeNames: {
        "#userId": "userId",
        "#itemId": "itemId"
      },
      KeyConditionExpression: "#userId = :v1 AND #itemId = :v2",
    }
    // return [{ id: JSON.stringify({ itemId, userId }) }]
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

export default listById;
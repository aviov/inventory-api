const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function listItems(userId: String) {
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      ExpressionAttributeValues: {
        ":v1": userId,
        ":v2": 'item:'
      },
      ExpressionAttributeNames: {
        "#userId": "userId",
        "#id": "id"
      },
      KeyConditionExpression: "#userId = :v1 AND begins_with(#id, :v2)"
      // KeyConditionExpression: 'userId = :userId',
      // ExpressionAttributeValues: {
      //   ':userId': userId
      // }
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

export default listItems;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function listAtGroup(entityType: string, groupId: string) {
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      IndexName: 'groupIdIndex',
      ExpressionAttributeValues: {
        ":v1": entityType.toLowerCase() + ':' + groupId,
        ":v2": entityType
      },
      ExpressionAttributeNames: {
        "#groupId": "groupId",
        "#entityType": "entityType"
      },
      KeyConditionExpression: "#groupId = :v1 AND #entityType = :v2"
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

export default listAtGroup;
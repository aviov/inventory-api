const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function listByRefId(entityType: String, refId: string, prefix?: string) {
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      IndexName : "refIdIndex",
      ExpressionAttributeValues: {
        ":v1": refId,
        ":v2": (prefix ? prefix : '') + entityType.toLowerCase() + ':'
      },
      ExpressionAttributeNames: {
        "#refId": "refId",
        "#id": "id"
      },
      KeyConditionExpression: "#refId = :v1 AND begins_with(#id, :v2)",
    }
    try {
        const data = await docClient.query(params).promise();
        return data.Items.map((one: any) => {
          const { userId, refId, ...rest } = one;
          return rest;
        });
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default listByRefId;
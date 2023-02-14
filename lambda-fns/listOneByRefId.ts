const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function listOneByRefId(refId: string, id: string) {
    const params = {
      TableName: process.env.INVENTORY_TABLE,
      IndexName : "refIdIndex",
      ExpressionAttributeValues: {
        ":v1": refId,
        ":v2": id
      },
      ExpressionAttributeNames: {
        "#refId": "refId",
        "#id": "id"
      },
      KeyConditionExpression: "#refId = :v1 AND #id = :v2",
    }
    try {
        const data = await docClient.query(params).promise();
        const { Items } = data;
        const oneOf = Items.length > 0 ? Items[0] : null;
        return oneOf;
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default listOneByRefId;
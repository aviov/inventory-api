const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function getEndUserAccount(idBeginsWith: String, userId: String) {
  const params = {
    TableName: process.env.INVENTORY_TABLE,
    ExpressionAttributeValues: {
      ":v1": userId,
      ":v2": idBeginsWith
    },
    ExpressionAttributeNames: {
      "#userId": "userId",
      "#id": "id"
    },
    KeyConditionExpression: "#userId = :v1 AND begins_with(#id, :v2)"
  }
  try {
      const data = await docClient.query(params).promise();
      const { Items } = data;
      return Items.length > 0 ? Items[0] : null;
  } catch (err) {
      console.log('DynamoDB error: ', err);
  }
}

export default getEndUserAccount;
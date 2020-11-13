const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function deleteItem(itemId: String, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          userId,
          id: itemId
        }
    }
    try {
        await docClient.delete(params).promise()
        return itemId
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default deleteItem;
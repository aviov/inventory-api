const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function deleteItem(itemId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Key: {
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
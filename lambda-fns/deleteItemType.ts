const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function deleteItemType(itemTypeId: String, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          userId,
          id: itemTypeId
        }
    }
    try {
        await docClient.delete(params).promise()
        return itemTypeId
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default deleteItemType;
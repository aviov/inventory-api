const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function getItemById(itemId: String, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          userId,
          id: itemId
        }
    }
    try {
        const { Item } = await docClient.get(params).promise()
        const { userId, ...rest } = Item;
        return rest;
    } catch (err) {
        console.log('DynamoDB error: ', err)
    }
}

export default getItemById
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function getItemById(itemId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Key: { id: itemId }
    }
    try {
        const { Item } = await docClient.get(params).promise()
        return Item
    } catch (err) {
        console.log('DynamoDB error: ', err)
    }
}

export default getItemById
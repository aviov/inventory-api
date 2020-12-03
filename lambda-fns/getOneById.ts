const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function getOneById(oneId: String, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          userId,
          id: oneId
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

export default getOneById;
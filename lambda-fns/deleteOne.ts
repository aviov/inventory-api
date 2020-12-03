const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function deleteOne(oneId: String, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Key: {
          userId,
          id: oneId
        }
    }
    try {
        await docClient.delete(params).promise()
        return oneId
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default deleteOne;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function getItemBySerialNumber(serialNumber: String) {
    const params = {
        TableName: process.env.ITEMS_TABLE,
        Key: {
          serialNumber: serialNumber
        }
    }
    try {
        const { Item } = await docClient.get(params).promise()
        return Item
    } catch (err) {
        console.log('DynamoDB error: ', err)
    }
}

export default getItemBySerialNumber
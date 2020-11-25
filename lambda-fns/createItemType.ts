const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import ItemType = require('./ItemType');

async function createItemType(itemType: ItemType, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...itemType, userId }
    }
    try {
        await docClient.put(params).promise();
        return itemType;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createItemType;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import Item = require('./Item');

async function createItem(item: Item, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...item, userId }
    }
    try {
        await docClient.put(params).promise();
        return item;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createItem;
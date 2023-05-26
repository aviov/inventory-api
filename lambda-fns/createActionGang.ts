const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import ActionGang = require('./ActionGang');

async function createActionGang(actionGang: ActionGang, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...actionGang, userId, entityType: 'ActionGang' }
    }
    try {
        await docClient.put(params).promise();
        return actionGang;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createActionGang;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import ActionType = require('./ActionType');

async function createActionType(actionType: ActionType, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...actionType, userId, entityType: 'ActionType' }
    }
    try {
        await docClient.put(params).promise();
        return actionType;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createActionType;
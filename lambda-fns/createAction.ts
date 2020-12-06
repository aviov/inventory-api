const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import Action = require('./Action');
// import updateOne from './updateOne';
// import { sliceStringFrom } from './util-fns';

async function createAction(action: Action, userId: string) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...action, userId, entityType: 'Action' }
    }
    try {
        await docClient.put(params).promise();
        // await updateOne({ id: sliceStringFrom(action.itemId, 'item:'), actionId: 'item:' + action.id }, userId);
        return action;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createAction;
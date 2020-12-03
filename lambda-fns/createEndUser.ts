const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import EndUser = require('./EndUser');

async function createEndUser(endUser: EndUser, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...endUser, userId, entityType: 'EndUser' }
    }
    try {
        await docClient.put(params).promise();
        return endUser;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createEndUser;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import EndUserInfo = require('./EndUserInfo');

async function createEndUserInfo(endUserInfo: EndUserInfo, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...endUserInfo, userId, entityType: 'EndUserInfo' }
    }
    try {
        await docClient.put(params).promise();
        return endUserInfo;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createEndUserInfo;
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import Tenant = require('./Tenant');

async function createItem(tenant: Tenant, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...tenant, userId, entityType: 'Tenant' }
    }
    try {
        await docClient.put(params).promise();
        return tenant;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createItem;
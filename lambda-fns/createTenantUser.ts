const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import TenantUser = require('./TenantUser');

async function createTenantUser(tenantUser: TenantUser, userId: String, refId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...tenantUser, userId, refId, entityType: 'TenantUser' }
    }
    try {
        await docClient.put(params).promise();
        return tenantUser;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createTenantUser;
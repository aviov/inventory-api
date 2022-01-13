const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import Org = require('./Org');

async function createOrg(org: Org, userId: string) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...org, userId, entityType: 'Org' }
    }
    try {
        await docClient.put(params).promise();
        return org;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createOrg;
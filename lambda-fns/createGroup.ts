const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import Group = require('./Group');

async function createGroup(group: Group, userId: string) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...group, userId, entityType: 'Group' }
    }
    try {
        await docClient.put(params).promise();
        return group;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createGroup;
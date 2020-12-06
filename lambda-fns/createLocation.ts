const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import Location = require('./Location');

async function createLocation(location: Location, userId: string) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...location, userId, entityType: 'Location' }
    }
    try {
        await docClient.put(params).promise();
        return location;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createLocation;
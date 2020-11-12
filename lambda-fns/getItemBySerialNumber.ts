const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function getItemBySerialNumber(serialNumber: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        IndexName : "serialNumberIndex",
        ExpressionAttributeValues: {
            ":v": serialNumber
        },
        ExpressionAttributeNames: {
            "#serialNumber": "serialNumber"
        },
        KeyConditionExpression: "#serialNumber = :v"
    }
    try {
        const data = await docClient.query(params).promise();
        const { Items } = data;
        return Items.length > 0 ? Items[0] : null;
    } catch (err) {
        console.log('DynamoDB error: ', err);
    }
}

export default getItemBySerialNumber
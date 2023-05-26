const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import Project = require('./Project');

async function createProject(project: Project, userId: String) {
    const params = {
        TableName: process.env.INVENTORY_TABLE,
        Item: { ...project, userId, entityType: 'Project' }
    }
    try {
        await docClient.put(params).promise();
        return project;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default createProject;
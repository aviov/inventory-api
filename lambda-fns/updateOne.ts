const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

interface Params {
  TableName: string | undefined,
  Key: string | {},
  ExpressionAttributeValues: any,
  ExpressionAttributeNames: any,
  UpdateExpression: string,
  ReturnValues: string
}

async function updateOne(one: any, userId: String) {
  let params : Params = {
    TableName: process.env.INVENTORY_TABLE,
    Key: {
      userId: userId,
      id: one.id
    },
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {},
    UpdateExpression: "",
    ReturnValues: "ALL_NEW"
  };
  let prefix = "set ";
  let attributes = Object.keys(one);
  for (let i=0; i<attributes.length; i++) {
    let attribute = attributes[i];
    if (attribute !== "id") {
      params["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute;
      params["ExpressionAttributeValues"][":" + attribute] = one[attribute];
      params["ExpressionAttributeNames"]["#" + attribute] = attribute;
      prefix = ", ";
    }
 }
  console.log('params: ', params)
  try {
    const { Attributes: One } = await docClient.update(params).promise();
    const { userId, ...rest } = One;
    return rest;
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default updateOne;
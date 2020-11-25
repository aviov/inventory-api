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

async function updateItemType(itemType: any, userId: String) {
  let params : Params = {
    TableName: process.env.INVENTORY_TABLE,
    Key: {
      userId: userId,
      id: itemType.id
    },
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {},
    UpdateExpression: "",
    ReturnValues: "ALL_NEW"
  };
  let prefix = "set ";
  let attributes = Object.keys(itemType);
  for (let i=0; i<attributes.length; i++) {
    let attribute = attributes[i];
    if (attribute !== "id") {
      params["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute;
      params["ExpressionAttributeValues"][":" + attribute] = itemType[attribute];
      params["ExpressionAttributeNames"]["#" + attribute] = attribute;
      prefix = ", ";
    }
 }
  console.log('params: ', params)
  try {
    const { Attributes: ItemType } = await docClient.update(params).promise();
    const { userId, ...rest } = ItemType;
    return rest;
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default updateItemType;
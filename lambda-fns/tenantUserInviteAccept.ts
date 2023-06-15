const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
import { sliceStringFrom } from "./util-fns";

interface Params {
  TableName: string | undefined,
  Key: string | {},
  ExpressionAttributeValues: any,
  ExpressionAttributeNames: any,
  UpdateExpression: string,
  ReturnValues: string
}

async function tenantUserInviteAccept(one: any) {
  const { emailVerified } = one;
  const userId: string = sliceStringFrom(one.id, 'tenant:');
  const refId: string = 'user:' + emailVerified;
  const oneNew: any = {
    ...one,
    refId
  };
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
  let attributes = Object.keys(oneNew);
  for (let i=0; i<attributes.length; i++) {
    let attribute = attributes[i];
    if (attribute !== "id") {
      params["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute;
      params["ExpressionAttributeValues"][":" + attribute] = oneNew[attribute];
      params["ExpressionAttributeNames"]["#" + attribute] = attribute;
      prefix = ", ";
    }
 }
  try {
    const { Attributes: One } = await docClient.update(params).promise();
    const { userId, ...rest } = One;
    return rest;
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default tenantUserInviteAccept;
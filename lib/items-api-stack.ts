import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';

export class ItemsApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // api
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'items-api',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        }
      },
      xrayEnabled: true
    });

    // lambda data source and resolvers
    const itemsLambda = new lambda.Function(this, 'AppsyncItemsHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'appsync-ds-main.handler',
      code: lambda.Code.fromAsset('lambda-fns'),
      memorySize: 1024
    });

    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', itemsLambda);

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getItemById"
    });

    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getItemBySerialNumber"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listItems"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createItem"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteItem"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateItem"
    });

    // ddb table
    const itemsTable = new ddb.Table(this, 'CDKItemsTable', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING
      }
    });

    // ddb GSI to query by serialNumber
    itemsTable.addGlobalSecondaryIndex({
      indexName: 'serialNumberIndex',
      partitionKey: {
        name: 'serialNumber',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'dateCreatedAt',
        type: ddb.AttributeType.STRING
      }
    });

    // ddb table access from lambda
    itemsTable.grantFullAccess(itemsLambda);

    // env variable for ddb table
    itemsLambda.addEnvironment('ITEMS_TABLE', itemsTable.tableName);

    // print api
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKEY', {
      value: api.apiKey || ''
    });

    new cdk.CfnOutput(this, 'ItemsApiStack Region', {
      value: this.region
    });
  }
}

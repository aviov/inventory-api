import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as iam from '@aws-cdk/aws-iam';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';

export class InventoryApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // s3
    const bucket = new s3.Bucket(this, 'BucketAtInventory', {
      cors: [{
        maxAge: 3000,
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.PUT,
          s3.HttpMethods.POST,
          s3.HttpMethods.DELETE,
          s3.HttpMethods.HEAD
        ],
      }]
    });

    // print s3
    new cdk.CfnOutput(this, 'AttachmentsBucketName', {
      value: bucket.bucketName
    });
    
    // user pool
    const userPool = new cognito.UserPool(this, 'UserPoolAtInventory', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true }
    });

    // user pool client
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClientAtInventory', {
      userPool,
      generateSecret: false
    });

    // user identity pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPoolAtInventory', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName
        }
      ]
    });

    // iam role
    const role = new iam.Role(this, 'AppsyncIamRoleAtInventory', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    });

    // role policy
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'mobileanalytics:PutEvents',
          'cognito-sync:*',
          'cognito-identity:*',
        ],
        resources: ['*']
      })
    );

    // role policy to grant permission to s3 specific folder
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        effect: iam.Effect.ALLOW,
        resources: [
          bucket.bucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*"
        ],
      })
    );

    // identity pool role attachemnt
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachmentAtInventory', {
      identityPoolId: identityPool.ref,
      roles: { authenticated: role.roleArn }
    });

    // print cognito
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
    });
    new cdk.CfnOutput(this, 'AuthenticatedRoleName', {
      value: role.roleName
    });

    // api
    const api = new appsync.GraphqlApi(this, 'ApiAtInventory', {
      name: 'inventory-api',
      schema: appsync.Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: cdk.Expiration.after(cdk.Duration.days(365))
            }
          }
        ]
      },
      xrayEnabled: true
    });

    // api access with iam role
    // api.grant(role, appsync.IamResource.custom('types/Query/listItems'), 'appsync:GraphQL'); // ('types/Query/fields/listItems'), 'appsync:GraphQL')
    api.grantQuery(role);
    // api.grantQuery(role, 'getItemBySerialNumber');
    api.grantMutation(role);
    // api.grantMutation(role, 'createItemType');

    // lambda data source and resolvers
    const inventoryLambda = new lambda.Function(this, 'AppsyncItemsHandlerAtInventory', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'appsync-ds-main.handler',
      code: lambda.Code.fromAsset('lambda-fns'),
      memorySize: 1024
    });

    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', inventoryLambda);

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
      typeName: "Query",
      fieldName: "listItemTypes"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getItemTypeById"
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
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createItemType"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteItemType"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateItemType"
    });

    lambdaDs.createResolver({
      typeName: 'Item',
      fieldName: 'itemType'
    });

    lambdaDs.createResolver({
      typeName: 'Item',
      fieldName: 'actions'
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listEndUsers"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getEndUserById"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createEndUser"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateEndUser"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteEndUser"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listActions"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getActionById"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createAction"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateAction"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteAction"
    });

    lambdaDs.createResolver({
      typeName: 'Action',
      fieldName: 'endUser'
    });

    lambdaDs.createResolver({
      typeName: 'Action',
      fieldName: 'location'
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listLocations"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getLocationById"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createLocation"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateLocation"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteLocation"
    });

    // ddb table
    const inventoryTable = new ddb.Table(this, 'ItemsTableAtInventory', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'userId',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'id',
        type: ddb.AttributeType.STRING
      }
    });

    // ddb GSI to query by itemId
    inventoryTable.addGlobalSecondaryIndex({
      indexName: 'itemIdIndex',
      partitionKey: {
        name: 'userId',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'itemId',
        type: ddb.AttributeType.STRING
      }
    });

    // ddb GSI to query by serialNumber
    inventoryTable.addGlobalSecondaryIndex({
      indexName: 'serialNumberIndex',
      partitionKey: {
        name: 'userId',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'serialNumber',
        type: ddb.AttributeType.STRING
      }
    });

    // ddb table access from lambda
    inventoryTable.grantFullAccess(inventoryLambda);

    // env variable for ddb table
    inventoryLambda.addEnvironment('INVENTORY_TABLE', inventoryTable.tableName);

    // print api
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKEY', {
      value: api.apiKey || ''
    });

    new cdk.CfnOutput(this, 'InventoryApiStack Region', {
      value: this.region
    });
  }
}

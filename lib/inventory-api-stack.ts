import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as iam from '@aws-cdk/aws-iam';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as events from '@aws-cdk/aws-events';
import * as targets from '@aws-cdk/aws-events-targets';

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
      fieldName: "getEndUserAccount"
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
      fieldName: 'verifyEndUserEmailRequest'
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: 'verifyEndUserEmailConfirm'
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteEndUser"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createEndUserInfo"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateEndUserInfo"
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: 'inviteEndUserRequest'
    });

    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: 'inviteEndUserConfirm'
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteEndUserInfo"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "clientListActionsFuture"
    });

    lambdaDs.createResolver({
      typeName: 'ActionFuture',
      fieldName: 'item'
    });

    lambdaDs.createResolver({
      typeName: 'ActionFuture',
      fieldName: 'endUser'
    });

    lambdaDs.createResolver({
      typeName: 'ActionFuture',
      fieldName: 'location'
    });

    lambdaDs.createResolver({
      typeName: 'ActionFuture',
      fieldName: 'actionType'
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
      fieldName: 'item'
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
      typeName: 'Action',
      fieldName: 'actionType'
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listActionTypes"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getActionTypeById"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createActionType"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateActionType"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteActionType"
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
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "listGroups"
    });
    
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getGroupById"
    });

    lambdaDs.createResolver({
      typeName: "Group",
      fieldName: "endUserInfos"
    });

    lambdaDs.createResolver({
      typeName: "EndUserInfo",
      fieldName: "endUser"
    });

    lambdaDs.createResolver({
      typeName: "EndUserInfo",
      fieldName: "group"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "createGroup"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "updateGroup"
    });
    
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "deleteGroup"
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

    // ddb GSI to query recent actions arranged by start date
    inventoryTable.addGlobalSecondaryIndex({
      indexName: 'actionIdIndex',
      partitionKey: {
        name: 'entityType',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'dateActionStart',
        type: ddb.AttributeType.STRING
      }
    });

    // ddb GSI to query data of different entityTypes by groupId
    inventoryTable.addGlobalSecondaryIndex({
      indexName: 'groupIdIndex',
      partitionKey: {
        name: 'groupId',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'entityType',
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

    // // ddb GSI to query Entity type by id, used in mutation verifyEndUserEmail
    // inventoryTable.addGlobalSecondaryIndex({
    //   indexName: 'entityIdIndex',
    //   partitionKey: {
    //     name: 'entityType',
    //     type: ddb.AttributeType.STRING
    //   },
    //   sortKey: {
    //     name: 'id',
    //     type: ddb.AttributeType.STRING
    //   }
    // });

    // ddb table access from lambda
    inventoryTable.grantFullAccess(inventoryLambda);

    // env variable for ddb table
    inventoryLambda.addEnvironment('INVENTORY_TABLE', inventoryTable.tableName);

    // permission for items lambda to send emails
    inventoryLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ses:SendEmail'
        ],
        effect: iam.Effect.ALLOW,
        resources: ['arn:aws:ses:us-east-1:*:identity/*'],
      }
    ));

    // option 1
    // email lambda as target
    const sendEmailsTarget = new targets.LambdaFunction(inventoryLambda);

    new events.Rule(this, 'emailScheduleRule', {
      // schedule: events.Schedule.rate(cdk.Duration.minutes(10)),
      schedule: events.Schedule.expression('cron(42 5 ? * MON-SUN *)'),
      targets: [sendEmailsTarget]
    });

    // // option 2
    // // rule for email events
    // const emailEventRule = new events.Rule(this, 'emailScheduleRule', {
    // // schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
    // // schedule: events.Schedule.cron({ minute: '57', hour: '18' }),
    // // schedule: events.Schedule.expression('cron(3 9 * * ? *)'),
    //   schedule: events.Schedule.rate(cdk.Duration.minutes(3))
    // });
    // // connect email lambda and email rule
    // emailEventRule.addTarget(new targets.LambdaFunction(emailLambda));

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

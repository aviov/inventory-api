import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { App, Stack } from 'aws-cdk-lib';                 // core constructs
import { aws_s3 as s3 } from 'aws-cdk-lib';               // stable module
import * as codestar from '@aws-cdk/aws-codestar-alpha';  // experimental module


import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as s3 from '@aws-cdk/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import path = require('path');

export class InventoryApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

    // auth tenant pre token generation lambda
    const authTenant = new lambda.Function(this, 'authTenant', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'auth-tenant.handler',
      code: lambda.Code.fromAsset('lambda-fns')
    });
    
    // user pool
    const userPool = new cognito.UserPool(this, 'UserPoolAtInventory', {
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      signInAliases: { email: true },
      lambdaTriggers: {
        preTokenGeneration: authTenant
      },
      customAttributes: {
        'tenantId': new cognito.StringAttribute({ minLen: 1, maxLen: 256, mutable: false }),
        'roleId': new cognito.StringAttribute({ minLen: 1, maxLen: 256, mutable: false }),
        'tierId': new cognito.StringAttribute({ minLen: 1, maxLen: 256, mutable: false })
      }
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

    // iam unauthenticated role
    const roleUnauth = new iam.Role(this, 'AppsyncIamRoleUnauthAtInventory', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      )
    });

    // iam authenticated role
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
          bucket.bucketArn + "/public/*"
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
      // definition: appsync.Definition.fromFile(path.join(__dirname, '../graphql/schema.graphql')),
      schema: appsync.SchemaFile.fromAsset('graphql/schema.graphql'),
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
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'appsync-ds-main.handler',
      code: lambda.Code.fromAsset('lambda-fns'),
      memorySize: 1024
    });

    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', inventoryLambda);

    lambdaDs.createResolver("getTenantById", {
      typeName: "Query",
      fieldName: "getTenantById"
    });
    
    lambdaDs.createResolver("listTenants", {
      typeName: "Query",
      fieldName: "listTenants"
    });

    lambdaDs.createResolver("getTenantUser", {
      typeName: "Query",
      fieldName: "getTenantUser"
    });
    
    lambdaDs.createResolver("listTenantsNotOwn", {
      typeName: "Query",
      fieldName: "listTenantsNotOwn"
    });
    
    lambdaDs.createResolver("listTenantUsers", {
      typeName: "Query",
      fieldName: "listTenantUsers"
    });

    lambdaDs.createResolver("getOrgById", {
      typeName: "Query",
      fieldName: "getOrgById"
    });
    
    lambdaDs.createResolver("listOrgs", {
      typeName: "Query",
      fieldName: "listOrgs"
    });

    lambdaDs.createResolver("getItemById", {
      typeName: "Query",
      fieldName: "getItemById"
    });

    lambdaDs.createResolver("getItemBySerialNumber", {
      typeName: "Query",
      fieldName: "getItemBySerialNumber"
    });
    
    lambdaDs.createResolver("listItems", {
      typeName: "Query",
      fieldName: "listItems"
    });
    
    lambdaDs.createResolver("listItemTypes", {
      typeName: "Query",
      fieldName: "listItemTypes"
    });
    
    lambdaDs.createResolver("getItemTypeById", {
      typeName: "Query",
      fieldName: "getItemTypeById"
    });
    
    lambdaDs.createResolver("createTenant", {
      typeName: "Mutation",
      fieldName: "createTenant"
    });
    
    lambdaDs.createResolver("deleteTenant", {
      typeName: "Mutation",
      fieldName: "deleteTenant"
    });
    
    lambdaDs.createResolver("updateTenant", {
      typeName: "Mutation",
      fieldName: "updateTenant"
    });
    
    lambdaDs.createResolver("createOrg", {
      typeName: "Mutation",
      fieldName: "createOrg"
    });
    
    lambdaDs.createResolver("deleteOrg", {
      typeName: "Mutation",
      fieldName: "deleteOrg"
    });
    
    lambdaDs.createResolver("updateOrg", {
      typeName: "Mutation",
      fieldName: "updateOrg"
    });
    
    lambdaDs.createResolver("createItem", {
      typeName: "Mutation",
      fieldName: "createItem"
    });
    
    lambdaDs.createResolver("deleteItem", {
      typeName: "Mutation",
      fieldName: "deleteItem"
    });
    
    lambdaDs.createResolver("updateItem", {
      typeName: "Mutation",
      fieldName: "updateItem"
    });
    
    lambdaDs.createResolver("createItemType", {
      typeName: "Mutation",
      fieldName: "createItemType"
    });
    
    lambdaDs.createResolver("deleteItemType", {
      typeName: "Mutation",
      fieldName: "deleteItemType"
    });
    
    lambdaDs.createResolver("updateItemType", {
      typeName: "Mutation",
      fieldName: "updateItemType"
    });

    lambdaDs.createResolver('itemType', {
      typeName: 'Item',
      fieldName: 'itemType'
    });

    lambdaDs.createResolver('actions', {
      typeName: 'Item',
      fieldName: 'actions'
    });
    
    lambdaDs.createResolver("listEndUsers", {
      typeName: "Query",
      fieldName: "listEndUsers"
    });
    
    lambdaDs.createResolver("getEndUserAccount", {
      typeName: "Query",
      fieldName: "getEndUserAccount"
    });
    
    lambdaDs.createResolver("getEndUserById", {
      typeName: "Query",
      fieldName: "getEndUserById"
    });
    
    lambdaDs.createResolver("createEndUser", {
      typeName: "Mutation",
      fieldName: "createEndUser"
    });
    
    lambdaDs.createResolver("updateEndUser", {
      typeName: "Mutation",
      fieldName: "updateEndUser"
    });

    lambdaDs.createResolver('verifyEndUserEmailRequest', {
      typeName: "Mutation",
      fieldName: 'verifyEndUserEmailRequest'
    });

    lambdaDs.createResolver('verifyEndUserEmailConfirm', {
      typeName: "Mutation",
      fieldName: 'verifyEndUserEmailConfirm'
    });
    
    lambdaDs.createResolver( "updateTenantUser", {
      typeName: "Mutation",
      fieldName: "updateTenantUser"
    });
    
    lambdaDs.createResolver("deleteTenantUser", {
      typeName: "Mutation",
      fieldName: "deleteTenantUser"
    });

    lambdaDs.createResolver('inviteTenantUserRequest', {
      typeName: "Mutation",
      fieldName: 'inviteTenantUserRequest'
    });

    lambdaDs.createResolver('inviteTenantUserAccept', {
      typeName: "Mutation",
      fieldName: 'inviteTenantUserAccept'
    });
    
    // unused yet
    // lambdaDs.createResolver({
    //   typeName: "Mutation",
    //   fieldName: 'tenantUserInviteAcceptToken'
    // });
    
    lambdaDs.createResolver("deleteEndUser", {
      typeName: "Mutation",
      fieldName: "deleteEndUser"
    });
    
    lambdaDs.createResolver("createEndUserInfo", {
      typeName: "Mutation",
      fieldName: "createEndUserInfo"
    });
    
    lambdaDs.createResolver("updateEndUserInfo", {
      typeName: "Mutation",
      fieldName: "updateEndUserInfo"
    });

    lambdaDs.createResolver('inviteEndUserRequest', {
      typeName: "Mutation",
      fieldName: 'inviteEndUserRequest'
    });

    lambdaDs.createResolver('inviteEndUserConfirm', {
      typeName: "Mutation",
      fieldName: 'inviteEndUserConfirm'
    });
    
    lambdaDs.createResolver("deleteEndUserInfo", {
      typeName: "Mutation",
      fieldName: "deleteEndUserInfo"
    });
    
    lambdaDs.createResolver("clientListActionsFuture", {
      typeName: "Query",
      fieldName: "clientListActionsFuture"
    });

    lambdaDs.createResolver('ActionFuture_item', {
      typeName: 'ActionFuture',
      fieldName: 'item'
    });

    lambdaDs.createResolver('ActionFuture_endUser', {
      typeName: 'ActionFuture',
      fieldName: 'endUser'
    });

    lambdaDs.createResolver('ActionFuture_location', {
      typeName: 'ActionFuture',
      fieldName: 'location'
    });

    lambdaDs.createResolver('ActionFuture_actionType', {
      typeName: 'ActionFuture',
      fieldName: 'actionType'
    });
    
    lambdaDs.createResolver("listActions", {
      typeName: "Query",
      fieldName: "listActions"
    });
    
    lambdaDs.createResolver("getActionById", {
      typeName: "Query",
      fieldName: "getActionById"
    });
    
    lambdaDs.createResolver("createAction", {
      typeName: "Mutation",
      fieldName: "createAction"
    });
    
    lambdaDs.createResolver("updateAction", {
      typeName: "Mutation",
      fieldName: "updateAction"
    });
    
    lambdaDs.createResolver("deleteAction", {
      typeName: "Mutation",
      fieldName: "deleteAction"
    });

    lambdaDs.createResolver('Action_item', {
      typeName: 'Action',
      fieldName: 'item'
    });

    lambdaDs.createResolver('Action_endUser', {
      typeName: 'Action',
      fieldName: 'endUser'
    });

    lambdaDs.createResolver('Action_location', {
      typeName: 'Action',
      fieldName: 'location'
    });

    lambdaDs.createResolver('Action_actionType', {
      typeName: 'Action',
      fieldName: 'actionType'
    });
    
    lambdaDs.createResolver("listActionTypes", {
      typeName: "Query",
      fieldName: "listActionTypes"
    });
    
    lambdaDs.createResolver("getActionTypeById", {
      typeName: "Query",
      fieldName: "getActionTypeById"
    });
    
    lambdaDs.createResolver("createActionType", {
      typeName: "Mutation",
      fieldName: "createActionType"
    });
    
    lambdaDs.createResolver("updateActionType", {
      typeName: "Mutation",
      fieldName: "updateActionType"
    });
    
    lambdaDs.createResolver("deleteActionType", {
      typeName: "Mutation",
      fieldName: "deleteActionType"
    });
    

    lambdaDs.createResolver("listActionGangs", {
      typeName: "Query",
      fieldName: "listActionGangs"
    });
    
    lambdaDs.createResolver("getActionGangById", {
      typeName: "Query",
      fieldName: "getActionGangById"
    });
    
    lambdaDs.createResolver("createActionGang", {
      typeName: "Mutation",
      fieldName: "createActionGang"
    });
    
    lambdaDs.createResolver("updateActionGang", {
      typeName: "Mutation",
      fieldName: "updateActionGang"
    });
    
    lambdaDs.createResolver("deleteActionGang", {
      typeName: "Mutation",
      fieldName: "deleteActionGang"
    });
    

    lambdaDs.createResolver("listProjects", {
      typeName: "Query",
      fieldName: "listProjects"
    });
    
    lambdaDs.createResolver("getProjectById", {
      typeName: "Query",
      fieldName: "getProjectById"
    });
    
    lambdaDs.createResolver("createProject", {
      typeName: "Mutation",
      fieldName: "createProject"
    });
    
    lambdaDs.createResolver("updateProject", {
      typeName: "Mutation",
      fieldName: "updateProject"
    });
    
    lambdaDs.createResolver("deleteProject", {
      typeName: "Mutation",
      fieldName: "deleteProject"
    });
    

    lambdaDs.createResolver("listLocations", {
      typeName: "Query",
      fieldName: "listLocations"
    });
    
    lambdaDs.createResolver("getLocationById", {
      typeName: "Query",
      fieldName: "getLocationById"
    });
    
    lambdaDs.createResolver("createLocation", {
      typeName: "Mutation",
      fieldName: "createLocation"
    });
    
    lambdaDs.createResolver("updateLocation", {
      typeName: "Mutation",
      fieldName: "updateLocation"
    });
    
    lambdaDs.createResolver("deleteLocation", {
      typeName: "Mutation",
      fieldName: "deleteLocation"
    });
    
    lambdaDs.createResolver("listGroups", {
      typeName: "Query",
      fieldName: "listGroups"
    });
    
    lambdaDs.createResolver("getGroupById", {
      typeName: "Query",
      fieldName: "getGroupById"
    });

    lambdaDs.createResolver("endUserInfos", {
      typeName: "Group",
      fieldName: "endUserInfos"
    });

    lambdaDs.createResolver("EndUserInfo_endUser", {
      typeName: "EndUserInfo",
      fieldName: "endUser"
    });

    lambdaDs.createResolver("group", {
      typeName: "EndUserInfo",
      fieldName: "group"
    });
    
    lambdaDs.createResolver("createGroup", {
      typeName: "Mutation",
      fieldName: "createGroup"
    });
    
    lambdaDs.createResolver("updateGroup", {
      typeName: "Mutation",
      fieldName: "updateGroup"
    });
    
    lambdaDs.createResolver("deleteGroup", {
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

    // ddb GSI to query by refId (PK2, SK1)
    inventoryTable.addGlobalSecondaryIndex({
      indexName: 'refIdIndex',
      partitionKey: {
        name: 'refId',
        type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'id',
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

    // ddb table access from lambda
    inventoryTable.grantFullAccess(authTenant);
    
    // env variable for ddb table
    authTenant.addEnvironment('INVENTORY_TABLE', inventoryTable.tableName);

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

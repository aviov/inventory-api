import list from './list';
import listByRefId from './listByRefId';
import {
  sliceStringFrom,
  getLatestByDateTenantLogIn
} from './util-fns';

type CognitoEvent = {
  request: {
    userAttributes: {
      sub: string,
      email: string
    },
    groupConfiguration: {
      groupsToOverride: any
    }
  },
  response: object,
};


exports.handler = async (event: CognitoEvent, context: object, callback: any) => {
  const cognitoSignIn = event.request.userAttributes.sub;
  const cognitoEmail = event.request.userAttributes.email;
  
  // console.log(
  //   '\n event', event,
  //   '\n context', context,
  //   '\n cognitoSignIn', cognitoSignIn,
  // );

  // // get old groups
  // const tenantIds = event.request.groupConfiguration.groupsToOverride;
  // get latest tenant login
  const tenants = (await list('Tenant', cognitoSignIn)) || [];
  const tenantUsers = (await listByRefId('TenantUser', ('user:' + cognitoEmail))) || [];
  const tenantsAll = tenants.concat(tenantUsers);
  const currentTenant: any = getLatestByDateTenantLogIn(tenantsAll) || {};
  const currentTenantId = sliceStringFrom(currentTenant.id, 'tenant:');

  // console.log(
  //   'event auth', event,
  //   // '\n groups', tenantIds,
  //   '\n tenants', tenants,
  //   '\n tenantUserss', tenantUsers,
  //   '\n tenantsAll', tenantsAll,
  //   '\n currentTenant.id', currentTenant.id,
  //   '\n currentTenantId', currentTenantId
  //   // '\n tenantIds', updatedTenantIds
  // );
  
  // add tenant to groups
  event.response = {
    claimsOverrideDetails: {
      groupOverrideDetails: {
        groupsToOverride: [currentTenantId],
      },
    },
  };
  // Return to Amazon Cognito
  callback(null, event);
};
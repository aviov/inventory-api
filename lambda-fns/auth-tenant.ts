import list from './list';
import {
  sliceStringFrom,
  getLatestByDateTenantLogIn
} from './util-fns';

type CognitoEvent = {
  request: {
    userAttributes: {
      sub: string
    },
    groupConfiguration: {
      groupsToOverride: any
    }
  },
  response: object,
};


exports.handler = async (event: CognitoEvent, context: object, callback: any) => {
  const cognitoSignIn = event.request.userAttributes.sub;
  
  // console.log(
  //   '\n event', event,
  //   '\n context', context,
  //   '\n cognitoSignIn', cognitoSignIn,
  // );

  // // get old groups
  // const tenantIds = event.request.groupConfiguration.groupsToOverride;
  // get latest tenant login
  const tenants = (await list('Tenant', cognitoSignIn)) || [];
  const currentTenant: any = getLatestByDateTenantLogIn(tenants) || {};
  const currentTenantId = sliceStringFrom(currentTenant.id, 'tenant:');

  // console.log(
  //   '\n groups', tenantIds,
  //   '\n tenants', tenants,
  //   '\n tenantIds', updatedTenantIds
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
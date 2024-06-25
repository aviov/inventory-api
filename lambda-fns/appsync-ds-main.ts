import createTenant from './createTenant';
import createOrg from './createOrg';
import createItem from './createItem';
import deleteItem from './deleteItem';
import getItemById from './getItemById';
import getItemBySerialNumber from './getItemBySerialNumber';
import listItems from './listItems';
import updateItem from './updateItem';
import createItemType from './createItemType';
import deleteItemType from './deleteItemType';
import getItemTypeById from './getItemTypeById';
import listById from './listById';
import listItemTypes from './listItemTypes';
import updateItemType from './updateItemType';
import getEndUserAccount from './getEndUserAccount';
import createEndUser from './createEndUser';
import verifyEndUserEmailRequest from './verifyEndUserEmailRequest';
import verifyEndUserEmailConfirm from './verifyEndUserEmailConfirm';
import tenantUserInviteRequest from './tenantUserInviteRequest';
import tenantUserInviteAccept from './tenantUserInviteAccept';
// import tenantUserInviteDecline from './tenantUserInviteDecline';
import tenantUserInviteAcceptToken from './tenantUserInviteAcceptToken';
import endUserInviteRequestEmail from './endUserInviteRequestEmail';
import endUserInviteConfirmEmail from './endUserInviteConfirmEmail';
import listAtGroup from './listAtGroup';
import updateOne from './updateOne';
import deleteOne from './deleteOne';
import list from './list';
import listOneByRefId from './listOneByRefId';
import listByRefId from './listByRefId';
import getOneById from './getOneById';
import createAction from './createAction';
import clientShceduledEmails from './clientScheduledEmails';
import clientListActionsFuture from './clientListActionsFuture';
import createActionType from './createActionType';
import createActionGang from './createActionGang';
import createProject from './createProject';
import createLocation from './createLocation';
import createGroup from './createGroup';
import Tenant = require('./Tenant');
import TenantUser = require('./TenantUser');
import Org = require('./Org');
import Item = require('./Item');
import ItemType = require('./ItemType');
import EndUser = require('./EndUser');
import EndUserInfo = require('./EndUserInfo');
import Group = require('./Group');
import Action = require('./Action');
import ActionType = require('./ActionType');
import ActionGang = require('./ActionGang');
import Project = require('./Project');
import Location = require('./Location');
import {
  getCognitoSignIn,
  sliceStringFrom
} from './util-fns';

type AppSyncEvent = {
  info: {
    fieldName: string
    parentTypeName: string
  },
  arguments: {
    prefix: string,
    tenant: Tenant,
    tenantId: string,
    refId: string,
    tenantUserId: string,
    tenantUser: TenantUser,
    tenantUserToken: string,
    org: Org,
    orgId: string
    itemId: string,
    serialNumber: string,
    item: Item,
    itemTypeId: string,
    itemType: ItemType,
    endUserId: string,
    endUserToken: string,
    endUser: EndUser,
    endUserInfo: EndUserInfo,
    endUserInfoToken: string,
    endUserInfoId: string,
    groupId: string,
    group: Group
    actionId: string,
    action: Action,
    actionTypeId: string,
    actionType: ActionType,
    actionGangId: string,
    actionGang: ActionGang,
    projectId: string,
    project: Project,
    locationId: string,
    location: Location
  },
  source: {
    id: string,
    userId: string,
    itemTypeId: string,
    actionId: string,
    itemId: string,
    groupId: string,
    endUserId: string,
    locationId: string,
    actionTypeId: string
  },
  identity: {
    cognitoIdentityAuthProvider: string
    cognitoIdentityId: string
  },
  request: {
    headers: {
      tenant: string
    }
  }
  'detail-type': string
};

exports.handler = async (event: AppSyncEvent, context: object) => {
  if (event['detail-type'] && event['detail-type'] === 'Scheduled Event') {
    const emailResults = await clientShceduledEmails(event, context);
    return emailResults;
  } else {
    if (event.info && event.info.parentTypeName === 'ActionFuture') {
      switch (event.info.fieldName) {
        case "item":
          return await getOneById(sliceStringFrom(event.source.itemId, 'item:'), event.source.userId);
        case "endUser":
          return await getOneById(sliceStringFrom(event.source.endUserId, 'enduser:'), event.source.userId);
        case "location":
          return await getOneById(sliceStringFrom(event.source.locationId, 'location:'), event.source.userId);
        case "actionType":
          return await getOneById(sliceStringFrom(event.source.actionTypeId, 'actiontype:'), event.source.userId);
        default:
          return null;
      }
    }

    if (event.info && event.info.fieldName === 'verifyEndUserEmailConfirm') {
      return await verifyEndUserEmailConfirm(event.arguments.endUserToken);
    }

    if (event.info && event.info.fieldName === 'inviteEndUserConfirm') {
      return await endUserInviteConfirmEmail(event.arguments.endUserInfoToken);
    }

    if (event.info && event.info.fieldName === 'clientListActionsFuture') {
      return await clientListActionsFuture();
    }

    const cognitoSignIn = getCognitoSignIn(event.identity.cognitoIdentityAuthProvider);
    const cognitoIdentity = event.identity.cognitoIdentityId;
    const tenant = event.request.headers.tenant;
    const userId = (tenant && tenant !== 'null') ? tenant : cognitoIdentity
    
    switch (event.info.fieldName) {
      case "listTenants":
        return await list('Tenant', cognitoSignIn);
      case "getTenantById":
        return await getOneById(event.arguments.tenantId, cognitoSignIn);
      case "createTenant":
        return await createTenant(event.arguments.tenant, cognitoSignIn);
      case "updateTenant":
        return await updateOne(event.arguments.tenant, cognitoSignIn);
      case "deleteTenant":
        return await deleteOne(event.arguments.tenantId, cognitoSignIn);
      case "listTenantUsers":
        return await list('TenantUser', userId);
      case "listTenantsNotOwn":
        return await listByRefId('TenantUser', event.arguments.refId, event.arguments.prefix);
      case "getTenantUser":
        return await listOneByRefId(event.arguments.refId, event.arguments.tenantUserId);
      case "updateTenantUser":
        return await updateOne(event.arguments.tenantUser, sliceStringFrom(event.arguments.tenantUser.id, 'tenant:'));
      case "deleteTenantUser":
        return await deleteOne(event.arguments.tenantUserId, userId);
      case 'inviteTenantUserRequest':
        return await tenantUserInviteRequest(event.arguments.tenantUser, userId);
      case 'inviteTenantUserAccept':
        return await tenantUserInviteAccept(event.arguments.tenantUser);
      // case 'inviteTenantUserDecline':
        // return await tenantUserInviteDecline(event.arguments.tenantUser, userId);
      case 'tenantUserInviteAcceptToken':
        return await tenantUserInviteAcceptToken(event.arguments.tenantUserToken);
      case "listOrgs":
        return await list('Org', userId, event.arguments.prefix);
      case "getOrgById":
        return await getOneById(event.arguments.orgId, userId);
      case "createOrg":
        return await createOrg(event.arguments.org, userId);
      case "updateOrg":
        return await updateOne(event.arguments.org, userId);
      case "deleteOrg":
        return await deleteOne(event.arguments.orgId, userId);
      case "getItemById":
        return await getItemById(event.arguments.itemId, userId);
      case "getItemBySerialNumber":
        return await getItemBySerialNumber(event.arguments.serialNumber, userId);
      case "createItem":
        return await createItem(event.arguments.item, userId);
      case "listItems":
        return await listItems(userId);
      case "deleteItem":
        return await deleteItem(event.arguments.itemId, userId);
      case "updateItem":
        return await updateItem(event.arguments.item, userId);
      case "getItemTypeById":
        return await getItemTypeById(event.arguments.itemTypeId, userId);
      case "createItemType":
        return await createItemType(event.arguments.itemType, userId);
      case "listItemTypes":
        return await listItemTypes(userId);
      case "deleteItemType":
        return await deleteItemType(event.arguments.itemTypeId, userId);
      case "updateItemType":
        return await updateItemType(event.arguments.itemType, userId);
      case "itemType":
        return await getOneById(sliceStringFrom(event.source.itemTypeId, 'itemtype:'), userId);
      case "actions":
        return await listById(('action:' + event.source.id), userId);
      case "listEndUsers":
        return await list('EndUser', userId, event.arguments.prefix);
      case "getEndUserById":
        return await getOneById(event.arguments.endUserId, userId);
      case "getEndUserAccount":
        return await getEndUserAccount('enduser:account:', userId);
      case "createEndUser":
        return await createEndUser(event.arguments.endUser, userId);
      case "updateEndUser":
        return await updateOne(event.arguments.endUser, userId);
      case 'verifyEndUserEmailRequest':
        return await verifyEndUserEmailRequest(event.arguments.endUser, userId)
      // case 'verifyEndUserEmailConfirm':
      //   return await verifyEndUserEmailConfirm(event.arguments.endUserToken);
      case "deleteEndUser":
        return await deleteOne(event.arguments.endUserId, userId);
      case 'inviteEndUserRequest':
        return await endUserInviteRequestEmail(event.arguments.endUserInfo, userId);
      // case 'inviteEndUserConfirm':
      //   return await endUserInviteConfirmEmail(event.arguments.endUserInfoToken);
      case 'endUserInfos':
        return await listAtGroup('EndUserInfo', event.source.id) || [];
      case "deleteEndUserInfo":
        return await deleteOne(event.arguments.endUserInfoId, userId);
      case "group":
        return await getOneById(sliceStringFrom(event.source.endUserId, 'group:'), userId);
      case "listActions":
        return await list('Action', userId, event.arguments.prefix);
      // case "clientListActionsFuture":
      //   return await clientListActionsFuture();
      // case "actionFuture":
      //   return await getOneById(sliceStringFrom(event.source.id, 'action:'), event.source.userId);
      case "getActionById":
        return await getOneById(event.arguments.actionId, userId);
      case "createAction":
        return await createAction(event.arguments.action, userId);
      case "updateAction":
        return await updateOne(event.arguments.action, userId);
      case "deleteAction":
        return await deleteOne(event.arguments.actionId, userId);
      case "item":
        return await getOneById(sliceStringFrom(event.source.itemId, 'item:'), userId);
      case "endUser":
        return await getOneById(sliceStringFrom(event.source.endUserId, 'enduser:'), userId);
      case "location":
        return await getOneById(sliceStringFrom(event.source.locationId, 'location:'), userId);
      case "actionType":
        return await getOneById(sliceStringFrom(event.source.actionTypeId, 'actiontype:'), userId);
      case "listActionTypes":
        return await list('ActionType', userId);
      case "getActionTypeById":
        return await getOneById(event.arguments.actionTypeId, userId);
      case "createActionType":
        return await createActionType(event.arguments.actionType, userId);
      case "updateActionType":
        return await updateOne(event.arguments.actionType, userId);
      case "deleteActionType":
        return await deleteOne(event.arguments.actionTypeId, userId);

      case "listActionGangs":
        return await list('ActionGang', userId, event.arguments.prefix);
      case "getActionGangById":
        return await getOneById(event.arguments.actionGangId, userId);
      case "createActionGang":
        return await createActionGang(event.arguments.actionGang, userId);
      case "updateActionGang":
        return await updateOne(event.arguments.actionGang, userId);
      case "deleteActionGang":
        return await deleteOne(event.arguments.actionGangId, userId);

      case "listProjects":
        return await list('Project', userId);
      case "getProjectById":
        return await getOneById(event.arguments.projectId, userId);
      case "createProject":
        return await createProject(event.arguments.project, userId);
      case "updateProject":
        return await updateOne(event.arguments.project, userId);
      case "deleteProject":
        return await deleteOne(event.arguments.projectId, userId);
      
      case "listLocations":
        return await list('Location', userId);
      case "getLocationById":
        return await getOneById(event.arguments.locationId, userId);
      case "createLocation":
        return await createLocation(event.arguments.location, userId);
      case "updateLocation":
        return await updateOne(event.arguments.location, userId);
      case "deleteLocation":
        return await deleteOne(event.arguments.locationId, userId);
      case "listGroups":
        return await list('Group', userId);
      case "getGroupById":
        return await getOneById(event.arguments.groupId, userId);
      case "createGroup":
        return await createGroup(event.arguments.group, userId);
      case "updateGroup":
        return await updateOne(event.arguments.group, userId);
      case "deleteGroup":
        return await deleteOne(event.arguments.groupId, userId);
      default:
        return null;
    }
  };
};
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
import endUserInviteRequestEmail from './endUserInviteRequestEmail';
import endUserInviteConfirmEmail from './endUserInviteConfirmEmail';
import listAtGroup from './listAtGroup';
import updateOne from './updateOne';
import deleteOne from './deleteOne';
import list from './list';
import getOneById from './getOneById';
import createAction from './createAction';
import clientShceduledEmails from './clientScheduledEmails';
import clientListActionsFuture from './clientListActionsFuture';
import createActionType from './createActionType';
import createLocation from './createLocation';
import createGroup from './createGroup';
import Item = require('./Item');
import ItemType = require('./ItemType');
import EndUser = require('./EndUser');
import EndUserInfo = require('./EndUserInfo');
import Group = require('./Group');
import Action = require('./Action');
import ActionType = require('./ActionType');
import Location = require('./Location');
import {
  sliceStringFrom
} from './util-fns';

type AppSyncEvent = {
  info: {
    fieldName: string
    parentTypeName: string
  },
  arguments: {
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
    cognitoIdentityId: string
  },
  'detail-type': string
};

exports.handler = async (event: AppSyncEvent, context: object) => {
  // console.log('event', event, '');
  if (event['detail-type'] && event['detail-type'] === 'Scheduled Event') {
    const emailResults = await clientShceduledEmails(event, context);
    // console.log('emailResult', emailResults);
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
    switch (event.info.fieldName) {
      case "getItemById":
        return await getItemById(event.arguments.itemId, event.identity.cognitoIdentityId);
      case "getItemBySerialNumber":
        return await getItemBySerialNumber(event.arguments.serialNumber, event.identity.cognitoIdentityId);
      case "createItem":
        return await createItem(event.arguments.item, event.identity.cognitoIdentityId);
      case "listItems":
        return await listItems(event.identity.cognitoIdentityId);
      case "deleteItem":
        return await deleteItem(event.arguments.itemId, event.identity.cognitoIdentityId);
      case "updateItem":
        return await updateItem(event.arguments.item, event.identity.cognitoIdentityId);
      case "getItemTypeById":
        return await getItemTypeById(event.arguments.itemTypeId, event.identity.cognitoIdentityId);
      case "createItemType":
        return await createItemType(event.arguments.itemType, event.identity.cognitoIdentityId);
      case "listItemTypes":
        return await listItemTypes(event.identity.cognitoIdentityId);
      case "deleteItemType":
        return await deleteItemType(event.arguments.itemTypeId, event.identity.cognitoIdentityId);
      case "updateItemType":
        return await updateItemType(event.arguments.itemType, event.identity.cognitoIdentityId);
      case "itemType":
        return await getOneById(sliceStringFrom(event.source.itemTypeId, 'itemtype:'), event.identity.cognitoIdentityId);
      case "actions":
        return await listById(('action:' + event.source.id), event.identity.cognitoIdentityId);
      case "listEndUsers":
        return await list('EndUser', event.identity.cognitoIdentityId);
      case "getEndUserById":
        return await getOneById(event.arguments.endUserId, event.identity.cognitoIdentityId);
      case "getEndUserAccount":
        return await getEndUserAccount('enduser:account:', event.identity.cognitoIdentityId);
      case "createEndUser":
        return await createEndUser(event.arguments.endUser, event.identity.cognitoIdentityId);
      case "updateEndUser":
        return await updateOne(event.arguments.endUser, event.identity.cognitoIdentityId);
      case 'verifyEndUserEmailRequest':
        return await verifyEndUserEmailRequest(event.arguments.endUser, event.identity.cognitoIdentityId)
      case 'verifyEndUserEmailConfirm':
        return await verifyEndUserEmailConfirm(event.arguments.endUserToken);
      case "deleteEndUser":
        return await deleteOne(event.arguments.endUserId, event.identity.cognitoIdentityId);
      case 'inviteEndUserRequest':
        return await endUserInviteRequestEmail(event.arguments.endUserInfo, event.identity.cognitoIdentityId);
      case 'inviteEndUserConfirm':
        return await endUserInviteConfirmEmail(event.arguments.endUserInfoToken);
      case 'endUserInfos':
        return await listAtGroup('EndUserInfo', event.source.id) || [];
      case "deleteEndUserInfo":
        return await deleteOne(event.arguments.endUserInfoId, event.identity.cognitoIdentityId);
      case "group":
        return await getOneById(sliceStringFrom(event.source.endUserId, 'group:'), event.identity.cognitoIdentityId);
      case "listActions":
        return await list('Action', event.identity.cognitoIdentityId);
      case "clientListActionsFuture":
        return await clientListActionsFuture();
      // case "actionFuture":
      //   return await getOneById(sliceStringFrom(event.source.id, 'action:'), event.source.userId);
      case "getActionById":
        return await getOneById(event.arguments.actionId, event.identity.cognitoIdentityId);
      case "createAction":
        return await createAction(event.arguments.action, event.identity.cognitoIdentityId);
      case "updateAction":
        return await updateOne(event.arguments.action, event.identity.cognitoIdentityId);
      case "deleteAction":
        return await deleteOne(event.arguments.actionId, event.identity.cognitoIdentityId);
      case "item":
        return await getOneById(sliceStringFrom(event.source.itemId, 'item:'), event.identity.cognitoIdentityId);
      case "endUser":
        return await getOneById(sliceStringFrom(event.source.endUserId, 'enduser:'), event.identity.cognitoIdentityId);
      case "location":
        return await getOneById(sliceStringFrom(event.source.locationId, 'location:'), event.identity.cognitoIdentityId);
      case "actionType":
        return await getOneById(sliceStringFrom(event.source.actionTypeId, 'actiontype:'), event.identity.cognitoIdentityId);
      case "listActionTypes":
        return await list('ActionType', event.identity.cognitoIdentityId);
      case "getActionTypeById":
        return await getOneById(event.arguments.actionTypeId, event.identity.cognitoIdentityId);
      case "createActionType":
        return await createActionType(event.arguments.actionType, event.identity.cognitoIdentityId);
      case "updateActionType":
        return await updateOne(event.arguments.actionType, event.identity.cognitoIdentityId);
      case "deleteActionType":
        return await deleteOne(event.arguments.actionTypeId, event.identity.cognitoIdentityId);
      case "listLocations":
        return await list('Location', event.identity.cognitoIdentityId);
      case "getLocationById":
        return await getOneById(event.arguments.locationId, event.identity.cognitoIdentityId);
      case "createLocation":
        return await createLocation(event.arguments.location, event.identity.cognitoIdentityId);
      case "updateLocation":
        return await updateOne(event.arguments.location, event.identity.cognitoIdentityId);
      case "deleteLocation":
        return await deleteOne(event.arguments.locationId, event.identity.cognitoIdentityId);
      case "listGroups":
        return await list('Group', event.identity.cognitoIdentityId);
      case "getGroupById":
        return await getOneById(event.arguments.groupId, event.identity.cognitoIdentityId);
      case "createGroup":
        return await createGroup(event.arguments.group, event.identity.cognitoIdentityId);
      case "updateGroup":
        return await updateOne(event.arguments.group, event.identity.cognitoIdentityId);
      case "deleteGroup":
        return await deleteOne(event.arguments.groupId, event.identity.cognitoIdentityId);
      default:
        return null;
    }
  };
};
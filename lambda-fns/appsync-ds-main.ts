import createItem from './createItem';
import deleteItem from './deleteItem';
import getItemById from './getItemById';
import getItemBySerialNumber from './getItemBySerialNumber';
import listItems from './listItems';
import updateItem from './updateItem';
import createItemType from './createItemType';
import deleteItemType from './deleteItemType';
import getItemTypeById from './getItemTypeById';
import listItemTypes from './listItemTypes';
import updateItemType from './updateItemType';
import Item = require('./Item');
import ItemType = require('./ItemType');

type AppSyncEvent = {
  info: {
    fieldName: string
  },
  arguments: {
    itemId: string,
    serialNumber: string,
    item: Item,
    itemTypeId: string,
    itemType: ItemType
  },
  identity: {
    cognitoIdentityId: string
  }
};

exports.handler = async (event: AppSyncEvent) => {
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
    default:
      return null;
  }
};
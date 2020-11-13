import createItem from './createItem';
import deleteItem from './deleteItem';
import getItemById from './getItemById';
import getItemBySerialNumber from './getItemBySerialNumber';
import listItems from './listItems';
import updateItem from './updateItem';
import Item = require('./Item');

type AppSyncEvent = {
  info: {
    fieldName: string
  },
  arguments: {
    itemId: string,
    serialNumber: string,
    item: Item
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
      return await getItemBySerialNumber(event.arguments.serialNumber);
    case "createItem":
      return await createItem(event.arguments.item);
    case "listItems":
      return await listItems();
    case "deleteItem":
      return await deleteItem(event.arguments.itemId);
    case "updateItem":
      return await updateItem(event.arguments.item);
    default:
      return null;
  }
};
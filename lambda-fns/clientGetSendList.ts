const reducer = (accList: any, action: any) => {
  const endUserIsClientSendEmail = action.endUser && action.endUser.isClientSendEmail;
  const email = action.endUser && action.endUser.email;
  const emailVerified = action.endUser && action.endUser.emailVerified;
  const isEmailVerified = ((emailVerified && emailVerified) === (email && email));
  if (isEmailVerified && endUserIsClientSendEmail) {
    const endUserId = action.endUser && action.endUser.id;
    const endUserWithActionsIndex = accList.findIndex((endUserWithActions: any) =>
      ((endUserWithActions && endUserWithActions.endUser && endUserWithActions.endUser.id) === endUserId));
    if (endUserWithActionsIndex !== -1) {
      const endUserWithActionsUpdated = {
        ...accList[endUserWithActionsIndex],
        actions: [
          ...accList[endUserWithActionsIndex].actions,
          action
        ]
      };
      return [
        ...accList.slice(0, endUserWithActionsIndex),
        endUserWithActionsUpdated,
        ...accList.slice(endUserWithActionsIndex + 1)
      ]
    }
    if (endUserWithActionsIndex === -1) {
      const endUserWithActionsNew = {
        endUser: action.endUser,
        actions: [
          action
        ]
      };
      return [
        ...accList,
        endUserWithActionsNew,
      ]
    }
  } else {
    return accList;
  }
};

export const clientGetSendList = (actionsList: any) => (
  actionsList.reduce((accList: any, action: any) => reducer(accList, action), []
));
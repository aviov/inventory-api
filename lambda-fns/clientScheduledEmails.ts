import clientListActionsFuture from './clientGetListActionsFuture';
import { clientGetSendList } from './clientGetSendList';
import clientSendEmail from './clientSendEmail';

const clientShceduledEmails = async (event: object, context: object) => {
  
  const actionsFuture = await clientListActionsFuture(event, context);
  const sendList = await clientGetSendList(actionsFuture);
  // console.log('sendListJSON', JSON.stringify(sendList))
  // console.log('sendList', sendList);
  
  try {
    return await Promise.all(sendList.map(async (sendData: any) => {
      const email = sendData && sendData.endUser && sendData.endUser.email;
      const htmlBody =
          '<div>' +
            'Hi ' + ((sendData && sendData.endUser && sendData.endUser.name) ? sendData.endUser.name : '') +
          '</div>' +
          'Your future actions are here:' +
          '<ol>' + sendData.actions.map((action: any) => {
            const dateActionStart = new Date(action.dateActionStart);
            return (
              '<li>' +
                dateActionStart.toDateString() + ' ' +
                (action.location ? action.location.city : '') + ': ' +
                (action.location ? action.location.name : '') + ': ' +
                (action.actionType ? action.actionType.name : '') + ' ' +
                (action.item ? action.item.modelNumber : '') +
              '</li>'
            )
          }).join('') +
          '</ol>' +
          '<div>' +
            'Keep it up!' +
          '</div>';
      return clientSendEmail(email, htmlBody);
    }));
    // await clientSendEmail(htmlBodyList);
  } catch (err) {
    console.log("Error from clientSendEmail");
    throw JSON.stringify(err);
  }
};

export default clientShceduledEmails;
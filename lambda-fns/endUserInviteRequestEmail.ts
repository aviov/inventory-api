import jwt = require('jsonwebtoken');
import EndUserInfo = require('./EndUserInfo');
const jwtSecret: jwt.Secret = process.env.APPSYNC_JWT_SECRET || '';
const jwtExpiresIn = process.env.APPSYNC_JWT_SECRET_EXP_IN;
import endUserInviteRequestEmailHtml from './endUserInviteRequestEmailHtml';
import createEndUserInfo from './createEndUserInfo';
import sesSendEmail from './sesSendEmail';

async function endUserInviteRequestEmail(endUserInfo: EndUserInfo, userId: string) {
  const dateStr = new Date().valueOf().toString();
  const inviteInfoJSON = endUserInfo.inviteInfo;
  const inviteInfo = JSON.parse(inviteInfoJSON);
  const payload = {
    dateStr,
    userId: userId,
    endUserInfoId: endUserInfo.id,
    inviteInfo: inviteInfoJSON
  };
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
  const link = 'https://keepserv.io/inviteEmail?token=' + token; // 'http://localhost:3000/inviteEmail?token=' + token; //
  const bodyHtml = endUserInviteRequestEmailHtml(inviteInfo, link);
  const bodyText = 'Confirm to join the group at keepserv';
  const subject = 'Keepserv: confirmation to join the group';
  const endUserInfoResult = await createEndUserInfo(endUserInfo, userId);
  if (endUserInfoResult && endUserInfoResult.id) {
    await sesSendEmail(
      inviteInfo.emailInvited,
      bodyHtml,
      bodyText,
      subject
    );
    // console.log(
    //   'token', token,
    //   'bodyHtml', bodyHtml,
    //   'result', JSON.stringify(result)
    // );
    return endUserInfo;
  } else {
    return null
  }
}

export default endUserInviteRequestEmail;
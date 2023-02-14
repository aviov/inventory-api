// import jwt = require('jsonwebtoken');
import TenantUser = require('./TenantUser');
// const jwtSecret: jwt.Secret = process.env.APPSYNC_JWT_SECRET || '';
// const jwtExpiresIn = process.env.APPSYNC_JWT_SECRET_EXP_IN;
import tenantUserInviteRequestEmailHtml from './tenantUserInviteRequestEmailHtml';
import createTenantUser from './createTenantUser';
import sesSendEmail from './sesSendEmail';
import { sliceStringFrom } from './util-fns';

async function tenantUserInviteRequest(tenantUser: TenantUser, userId: string) {
  const { emailVerified } = tenantUser;
  const tenantUserId = 'tenantuser:' + emailVerified + ':tenant:' + sliceStringFrom(userId, ':').slice(1);
  const tenantUserWithId = {
    ...tenantUser,
    id: tenantUserId,
  };
  const inviteInfoJSON = tenantUser.inviteInfo;
  const inviteInfo = JSON.parse(inviteInfoJSON);
  // const dateStr = new Date().valueOf().toString();
  // const payload = {
  //   dateStr,
  //   userId: userId,
  //   tenantUserId,
  //   inviteInfo: inviteInfoJSON
  // };
  // const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
  const link = 'https://keepserv.io/tenants' // '?token=' + token;
  const bodyHtml = tenantUserInviteRequestEmailHtml(inviteInfo, link);
  const bodyText = 'Confirm to join organisation at keepserv';
  const subject = 'Keepserv: confirmation to join the organisation';
  const tenantUserResult = await createTenantUser(tenantUserWithId, userId, tenantUser.emailVerified);
  if (tenantUserResult && tenantUserResult.id) {
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
    return tenantUser;
  } else {
    return null
  }
}

export default tenantUserInviteRequest;
import jwt = require('jsonwebtoken');
const jwtSecret: jwt.Secret = process.env.APPSYNC_JWT_SECRET || '';
import updateOne from './updateOne';

// unused yet
async function tenantUserInviteConfirm(tenantUserToken: string) {
  try {
    const decoded = jwt.verify(tenantUserToken, jwtSecret);
    // console.log(decoded);
    const decodedJSON = JSON.stringify(decoded);
    const decodedObject = JSON.parse(decodedJSON);
    const dateAccept = new Date().toISOString();
    const {
      userId,
      tenantUserId,
      inviteInfo: inviteInfoJSON
    } = decodedObject;
    const inviteInfo = JSON.parse(inviteInfoJSON);
    const { confirmedBy } = await updateOne(
      {
        id: tenantUserId,
        inviteInfo: JSON.stringify({
          ...inviteInfo,
          dateAccept
        })
      },
      userId
    );
    return confirmedBy;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export default tenantUserInviteConfirm;
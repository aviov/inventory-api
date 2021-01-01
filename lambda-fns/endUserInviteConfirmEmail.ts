import jwt = require('jsonwebtoken');
const jwtSecret: jwt.Secret = process.env.APPSYNC_JWT_SECRET || '';
import updateOne from './updateOne';

// type decoded = {
//   userId: string
//   endUserId: string
// };

async function endUserInviteConfirmEmail(endUserInfoToken: string) {
  try {
    const decoded = jwt.verify(endUserInfoToken, jwtSecret);
    console.log(decoded);
    const decodedJSON = JSON.stringify(decoded);
    const decodedObject = JSON.parse(decodedJSON);
    const dateConfirmed = new Date().toISOString();
    const {
      userId,
      endUserInfoId,
      inviteInfo: inviteInfoJSON
    } = decodedObject;
    const inviteInfo = JSON.parse(inviteInfoJSON);
    const { emailInvited } = inviteInfo;
    const { confirmedBy } = await updateOne(
      {
        id: endUserInfoId,
        confirmedBy: emailInvited,
        dateConfirmedAt: dateConfirmed,
      },
      userId
    );
    return confirmedBy;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export default endUserInviteConfirmEmail;
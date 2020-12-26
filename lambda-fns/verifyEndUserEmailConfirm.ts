import jwt = require('jsonwebtoken');
const jwtSecret: jwt.Secret = process.env.APPSYNC_JWT_SECRET || '';
import updateOne from './updateOne';

// type decoded = {
//   userId: string
//   endUserId: string
// };

async function verifyEndUserEmailConfirm(endUserToken: string) {
  try {
    const decoded = jwt.verify(endUserToken, jwtSecret);
    // console.log(decoded);
    const decodedJSON = JSON.stringify(decoded);
    const decodedObject = JSON.parse(decodedJSON);
    const {
      userId,
      endUserId,
      endUserEmail
    } = decodedObject;
    const { emailVerified } = await updateOne({ id: endUserId, emailVerified: endUserEmail }, userId);
    return emailVerified;
  } catch (error) {
    // console.log(error);
    return false;
  }
};

export default verifyEndUserEmailConfirm;
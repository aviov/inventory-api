import jwt = require('jsonwebtoken');
import EndUser = require('./EndUser');
const jwtSecret: jwt.Secret = process.env.APPSYNC_JWT_SECRET || '';
const jwtExpiresIn = process.env.APPSYNC_JWT_SECRET_EXP_IN;
import verifyEndUserEmailHtml from './verifyEndUserEmailHtml';
import updateOne from './updateOne';
import verifySendEmail from './verifySendEmail';

async function verifyEndUserEmailRequest(endUser: EndUser, userId: string) {
  const dateStr = new Date().valueOf().toString();
  const payload = {
    dateStr,
    userId: userId,
    endUserId: endUser.id,
    endUserEmail: endUser.email,
  }
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
  const link = 'https://keepserv.io/verifyEmail?token=' + token; // 'http://localhost:3000/verifyEmail?token=' + token;
  const bodyHtml = verifyEndUserEmailHtml(endUser, link);
  const { emailVerified } = await updateOne({ id: endUser.id, emailVerified: '' }, userId);
  if (emailVerified === '') {
    const result = await verifySendEmail(endUser.email, bodyHtml);
    return JSON.stringify(result);
  } else {
    return null
  }
}

export default verifyEndUserEmailRequest;
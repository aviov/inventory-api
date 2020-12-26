const AWS = require('aws-sdk');

const ses = new AWS.SES();

const verifySendEmail = async (toAddress: string, bodyHtml: string) => {

  var params = {
    Source: "keep@keepserv.io",
    Destination: {
      ToAddresses: [
        toAddress
      ]
    },
    Message: {
      Subject: {
        Data: 'Keepserv: email confirmation',
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: 'Confirm to Keepserv that your email exists',
          Charset: 'UTF-8'
        },
        Html: {
          Data: bodyHtml,
          Charset: 'UTF-8'
        }
      }
    }
  };
  const result = await ses.sendEmail(params).promise();
  return result;
};

export default verifySendEmail;
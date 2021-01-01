const AWS = require('aws-sdk');

const ses = new AWS.SES();

const sesSendEmail = async (
  toAddress: string,
  bodyHtml: string,
  bodyText: string,
  subject: string
) => {

  var params = {
    Source: "keep@keepserv.io",
    Destination: {
      ToAddresses: [
        toAddress
      ]
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: bodyText,
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

export default sesSendEmail;
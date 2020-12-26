const AWS = require('aws-sdk');

const ses = new AWS.SES();

const clientSendEmail = async (toAddress: string, htmlBodyList: string) => {

  var params = {
    Source: "keep@keepserv.io",
    Destination: {
      ToAddresses: [
        toAddress
      ]
    },
    Message: {
      Subject: {
        Data: 'Keepserv next actions',
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: 'Your next actions',
          Charset: 'UTF-8'
        },
        Html: {
          Data: htmlBodyList,
          Charset: 'UTF-8'
        }
      }
    }
  };
  const result = await ses.sendEmail(params).promise();
  return result;
};

export default clientSendEmail;
const AWS = require('aws-sdk');
const AWSAppSyncClient = require('aws-appsync').default;
const { AUTH_TYPE } = require('aws-appsync');
require("isomorphic-fetch");
import { clientListActionsFuture } from './clientQueries'

const region = process.env.AWS_REGION;
// AWS.config.update({
//   region
// });
const appsyncUrl = process.env.APPSYNC_URL;
const apiKey = process.env.APPSYNC_API_KEY;
// const credentials = new AWS.Credentials(
//   process.env.AWS_ACCESS_KEY_ID,
//   process.env.AWS_SECRET_ACCESS_KEY,
//   process.env.AWS_SESSION_TOKEN
// );

let graphQLAppSyncClient: typeof AWSAppSyncClient;

function initializeClient() {
  // console.log('credentials', credentials);
  graphQLAppSyncClient = new AWSAppSyncClient({
    url: appsyncUrl,
    region,
    auth: {
      type: AUTH_TYPE.API_KEY,
      apiKey: apiKey,
      // credentials: credentials
    },
    disableOffline: true
  },
  {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  });
};

const getActionsFuture = async (event: object, context: object) => {

  if (!graphQLAppSyncClient) {
    initializeClient();
  }

  try {
    const response = await graphQLAppSyncClient.query({
      query: clientListActionsFuture,
      fetchPolicy: "network-only"
    });
    const { data } = response;
    const actionsFuture = data && data.clientListActionsFuture;
    return actionsFuture;
  } catch (err) {
    console.log("Error while trying to fetch data");
    throw JSON.stringify(err);
  }
};

export default getActionsFuture;
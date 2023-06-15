export const sliceStringFrom = (str: string, start: string) =>
  (((typeof str) === 'string') && !str.startsWith(start)) ?
  str.slice(str.indexOf(start)) :
  str;

export const getCognitoSignIn = (authProvider: string) => {
  const parts = authProvider.split(':');
  const cognitoSignIn = parts[parts.length - 1].slice(0, -1);
  return cognitoSignIn;
};

const compareDatesDescending = (dateA: string, dateB: string) => {
  if (dateA < dateB) { return 1 }
  if (dateA > dateB) { return -1 }
  return 0;
};

const getSortedDescendingByDateTenantLogIn = (arrayOfObjects=[]) => {
  return arrayOfObjects.slice().sort((a: any, b: any) =>
    compareDatesDescending(a.dateTenantLogIn, b.dateTenantLogIn));
};

export const getLatestByDateTenantLogIn = (arrayOfObjects=[]) => {
  return getSortedDescendingByDateTenantLogIn(arrayOfObjects)[0];
};

function tenantUserInviteRequestEmailHtml(inviteInfo: any, link: string) {
  const bodyHtml =
  '<div>' +
    'Hello ' +
    inviteInfo.nameInvited +
  '</div>' +
  '<div>' +
    'You are invited by admin ' +
    inviteInfo.nameInvitedBy + ' ' +
    'to join organisation ' +
    inviteInfo.tenantInvitedTo + ' ' +
    'at keepserv' +
    '.' +
    '\nSign in and accept invitation.' +
    '\nIn case you have questions, find us on ' +
    '<a href="https://keepserv.io">keepserv.io</a>' + ' ' +
    'or contact admin' +
    'by email ' +
    inviteInfo.emailInvitedBy + '' +
  '</div>' +
  '<div>' +
    '<a href=\"' + link + '\">Click this link</a>' +
    ' to accept.' +
  '</div>' +
  '<div>' +
    'Keep it up!' +
  '</div>';
  
  return bodyHtml;
}

export default tenantUserInviteRequestEmailHtml;
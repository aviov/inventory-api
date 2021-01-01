
function endUserInviteRequestEmailHtml(inviteInfo: any, link: string) {
  const bodyHtml =
  '<div>' +
    'Hello ' +
    inviteInfo.nameInvited +
  '</div>' +
  '<div>' +
    'You are invited by ' +
    inviteInfo.nameInvitedBy + ' ' +
    'to join group ' +
    inviteInfo.groupInvitedTo + ' ' +
    'at keepserv' +
    '.' +
    '\nIn case you have questions, find us on ' +
    '<a href="https://keepserv.io">keepserv.io</a>' + ' ' +
    'or contact ' +
    inviteInfo.nameInvitedBy + ' ' +
    'by email ' +
    inviteInfo.emailInvitedBy + '' +
  '</div>' +
  '<div>' +
    '<a href=\"' + link + '\">Click this link</a>' +
    ' to confirm.' +
  '</div>' +
  '<div>' +
    'Keep it up!' +
  '</div>';
  
  return bodyHtml;
}

export default endUserInviteRequestEmailHtml;
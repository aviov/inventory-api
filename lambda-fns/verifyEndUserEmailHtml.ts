
import EndUser = require('./EndUser');

function verifyEndUserEmailHtml(endUser: EndUser, link: string) {
  const bodyHtml =
  '<div>' +
    'Hello ' + endUser.name +
  '</div>' +
  '<div>' +
    'Your manager ' +
    'requested your confirmation to send next actions daily to your email ' +
    endUser.email + '.' +
  '</div>' +
  '<div>' +
    '<a href=\"' + link + '\">Click this link</a>' +
    ' to confirm.'
  '</div>' +
  '<div>' +
    'Keep it up!' +
  '</div>';
  
  return bodyHtml;
}

export default verifyEndUserEmailHtml;
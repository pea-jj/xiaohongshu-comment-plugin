export const getBizType = () => {
  const whiteUrlList = ["https://www.xiaohongshu.com/explore", "https://pro.xiaohongshu.com/enterprise/message/reply"];
  if (window.location.href.match(whiteUrlList[0])) {
    return 'NOTE'
  } else if (window.location.href.match(whiteUrlList[1])) {
    return 'SELF_MESSAGE'
  }
  return '';
}

export const sleepTime = (t) => {
  return new Promise(r => {
    setTimeout(() => {
      r();
    }, t);
  })
}

export function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[[]]/g, '\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2]);
}
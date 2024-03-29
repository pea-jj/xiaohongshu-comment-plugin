export const getBizType = () => {
  const whiteUrlList = [
    "https://www.xiaohongshu.com/explore",
    "https://www.xiaohongshu.com/search_result",
    "https://pro.xiaohongshu.com/enterprise/message/reply",
    "https://www.xiaohongshu.com/user/profile"
  ];
  if (window.location.href.match(whiteUrlList[0]) || window.location.href.match(whiteUrlList[1])) {
    return 'NOTE'
  } else if (window.location.href.match(whiteUrlList[2])) {
    return 'SELF_MESSAGE'
  } else if (window.location.href.match(whiteUrlList[3])) {
    return 'ACCOUNT'
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

export const getRandomReply = (text) => {
  if (!text) return '';
  const list = text.split(/[0-9]\. /);
  if (list.length > 1) {
    list.shift();
  }
  let randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
};
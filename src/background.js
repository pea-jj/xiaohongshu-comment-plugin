// 预留一个方法给popup调用
const globalConfig = {};
window.setGlobalConfig = (data) => {
  globalConfig = data;
}
window.getGlobalConfig = () => {
  return globalConfig;
}


export class StealRequestHeader {
  constructor() {
    this.headers = {};
  }
  
  getHeaders() {
    return this.headers;
  }

  setHeaders(data) {
    this.headers = data;
  }
}

export const stealRequestHeaderInstance = new StealRequestHeader();

window.chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    const { method, requestHeaders } = details;
    if (method === 'OPTIONS') return;
    console.log('details', details);
    const headersWhiteList = ['X-t', 'x-b3-traceid', 'X-s', 'X-s-common', 'X-S-Common'];
    const result = {};
    for (var i = 0; i < requestHeaders.length; ++i) {
      if (headersWhiteList.includes(requestHeaders[i].name)) {
        result[requestHeaders[i].name] = requestHeaders[i].value;
      }
    }
    stealRequestHeaderInstance.setHeaders(result);
    return { requestHeaders };
  },
  {
    urls: [
      "*://edith.xiaohongshu.com/api/sns/web/v2/comment/page*",
      "*://edith.xiaohongshu.com/api/sns/web/v1/comment/post*",
    ]},
  ["blocking", "requestHeaders"]
);

window.stealRequestHeaderInstance = stealRequestHeaderInstance;
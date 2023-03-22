// 预留一个方法给popup调用



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
    const headersWhiteList = ['X-t', 'x-b3-traceid', 'X-s'];
    const result = {};
    for (var i = 0; i < requestHeaders.length; ++i) {
      if (headersWhiteList.includes(requestHeaders[i].name)) {
        result[requestHeaders[i].name] = requestHeaders[i].vaule;
      }
    }
    stealRequestHeaderInstance.setHeaders(result);
    return { requestHeaders };
  },
  {urls: ["*://edith.xiaohongshu.com/api/sns/web/v2/comment/page*"]},
  ["blocking", "requestHeaders"]
);

window.stealRequestHeaderInstance = stealRequestHeaderInstance;
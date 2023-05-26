import { initialValues } from "./constants";
// pop配置面板全局数据
let globalConfig = initialValues;
window.setGlobalConfig = (data) => {
  globalConfig = data;
}
window.getGlobalConfig = () => {
  return globalConfig;
}

window.chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'getGlobalConfig') {
    sendResponse({
      globalConfig: globalConfig
    });
  }
});

// 打开标签进行关注任务
window.chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const { type, data } = request;
  if (type === 'follow') {
    window.chrome.windows.create(
      {
        url: 'https://www.xiaohongshu.com/user/profile/' + data[0],
        state: 'maximized',
      },
      async (followWindow) => {
        console.log('window', followWindow);
        const tab = followWindow.tabs[0];
        let i = 0;
        while (i < data.length) {
          sendResponse(i);
          const processFollow = () => new Promise((r) => {
            window.chrome.tabs.executeScript(tab.id, { code: `
              setTimeout(() => {
                document.querySelector('.user-info .follow') && document.querySelector('.user-info .follow').click();
              }, 2000 + Math.random() * 3000)
              ` });
            // document.querySelector('.note-item .like-wrapper') && document.querySelector('.note-item .like-wrapper').click();
            setTimeout(() => {
              if (data[i + 1]) {
                window.chrome.tabs.update(
                  tab.id,
                  {
                    url: 'https://www.xiaohongshu.com/user/profile/' + data[i + 1]
                  },
                  () => {
                    setTimeout(() => {
                      r(i++);
                    }, 1000);
                  },
                )
              } else {
                r(i++);
              }
            }, 6000 + Math.random() * 3000);
          })
          await processFollow();
        }
        window.chrome.windows.remove(
          followWindow.id,
        )
      },
    )
  }
});

// 打开标签进行自动回复任务
window.chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const { type, data } = request;
  if (type === 'autoCommentReply') {
    window.chrome.windows.create(
      {
        url: data.map((v, index) => 'https://www.xiaohongshu.com/explore/' + v + `?_s=${(index + 1) * 8}`),
      },
      async (followWindow) => {
        console.log('window', followWindow);
      },
    )
  }
});

// window.chrome.webRequest.onBeforeRequest.addListener(
//   ({ url }) => {
//     console.log('mmmm', url)
//     if (url.includes('main.e6b0c9c.js')) {
//       console.log('qqq')
//       return {
//         redirectUrl: url.replace('main.e6b0c9c.js', 'main.7e8a9a9.js')
//       };
//     }
//   },
//   {
//     urls: ['https://fe-static.xhscdn.com/formula-static/xhs-pc-web/public/js/main.e6b0c9c.js'],
//   },
//   ['blocking']
// )

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

// export const stealRequestHeaderInstance = new StealRequestHeader();

// 废弃
// window.chrome.webRequest.onBeforeSendHeaders.addListener(
//   function(details) {
//     const { method, requestHeaders } = details;
//     if (method === 'OPTIONS') return;
//     console.log('details', details);
//     const headersWhiteList = ['X-t', 'x-b3-traceid', 'X-s', 'X-s-common', 'X-S-Common'];
//     const result = {};
//     for (var i = 0; i < requestHeaders.length; ++i) {
//       if (headersWhiteList.includes(requestHeaders[i].name)) {
//         result[requestHeaders[i].name] = requestHeaders[i].value;
//       }
//     }
//     stealRequestHeaderInstance.setHeaders(result);
//     return { requestHeaders };
//   },
//   {
//     urls: [
//       "*://edith.xiaohongshu.com/api/sns/web/v2/comment/page*",
//       "*://edith.xiaohongshu.com/api/sns/web/v1/comment/post*",
//     ]},
//   ["blocking", "requestHeaders"]
// );

// window.stealRequestHeaderInstance = stealRequestHeaderInstance;
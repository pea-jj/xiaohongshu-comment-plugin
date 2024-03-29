(function (xhr) {
  var whiteListUrlList = [{
    url: '/api/sns/web/v2/comment/page',
    messageType: 'COMMENT_LIST',
  }, {
    url: '/api/eros/pm/chat/chatbox/total_list',
    messageType: 'CHAT_LIST',
  }, {
    url: '/api/eros/pm/chat/message/total_list?chat_user_id',
    messageType: 'CHAT_BOX',
  }, {
    url: '/api/sns/web/v1/user/me',
    messageType: 'ME',
  }, {
    url: '/api/sns/web/v2/user/me',
    messageType: 'ME',
  }, {
    url: '/api/eros/userqms/prof/apply/last',
    messageType: 'PRO_ME',
  }, {
    url: '/api/eros/user/info',
    messageType: 'PRO_ME_V2',
  }, {
    url: '/api/sns/web/v1/user_posted',
    messageType: 'NOTE_LIST',
  }];
  var XHR = XMLHttpRequest.prototype;
  var open = XHR.open;
  var send = XHR.send;

  XHR.open = function (method, url) {
    this._method = method;
    this._url = url;
    this._requestHeaders = {};
    this._startTime = (new Date()).toISOString();

    return open.apply(this, arguments);
  };

  XHR.send = function (postData) {
    var url = this._url ? this._url.toLowerCase() : this._url;
    this.addEventListener('load', function () {
      var myUrl = url;
      if (myUrl) {
        if (this.responseType != 'blob' && this.responseText) {
          try {
            var text = this.responseText;
            // 发送消息到content.js
            const messageType = whiteListUrlList.find(v => {
              return myUrl.includes(v.url)
            })?.messageType;
            messageType && window.postMessage({ type: messageType, message: JSON.parse(text), _url: myUrl })
          } catch (err) {
          }
        }
      }
    });
    if (url.includes('/api/eros/pm/chat/message/send')) {
      try {
        const data = JSON.parse(postData);
        const { content, content_type, receiver_id } = data || {};
        if (content_type === 'TEXT' && content?.startsWith('<image>')) {
          const str = content.split('<image> ')?.[1]?.trim();
          const hackData = {
            content: JSON.stringify(JSON.parse(str)),
            content_type: "IMAGE",
            receiver_id,
          }
          console.log('xxx', hackData)
          send.apply(this, [JSON.stringify(hackData)])
          return;
        }
      } catch (error) {
        console.log('send error', error)
      }
    }
    return send.apply(this, arguments);
  };

  function bindHistoryEvent(method) {
    const originMethod = window.history[method];
    if (!originMethod) {
      throw new Error("history has not this method named " + method);
    }
    // 闭包处理
    return function () {
      let result = null;
      try {
        originMethod.apply(this, arguments);
        //这里也可以把事件名称写死，后面做对应的监听即可
        const evt = new Event(method);
        evt.arguments = arguments;
        //分发事件
        window.dispatchEvent(evt);
        originMethod.apply(this, arguments);
      } catch (error) {
        throw new Error("执行出错");
      }
      return result;
    };
  }
  function init() {
    window.history.pushState = bindHistoryEvent("pushState");
    window.history.replaceState = bindHistoryEvent("replaceState");
  }
  init();
})(XMLHttpRequest);
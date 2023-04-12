(function (xhr) {
  var whiteListUrl = 'edith.xiaohongshu.com/api/sns/web/v2/comment/page';
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
    this.addEventListener('load', function () {

      var myUrl = this._url ? this._url.toLowerCase() : this._url;
      if (myUrl && myUrl.includes(whiteListUrl)) {
        if (this.responseType != 'blob' && this.responseText) {
          try {
            var text = this.responseText;
            // 发送消息到content.js
            window.postMessage({ type: "inject_message_type", message: JSON.parse(text) })
            // console.log('注入脚本发送: ', JSON.parse(text));
          } catch (err) {
          }
        }

      }
    });
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
import React from 'react';
import ReactDOM from 'react-dom/client';
import AITip from './components/AITip';

// 注入hack脚本
var s = document.createElement('script');
// must be listed in web_accessible_resources in manifest.json
s.src = window.chrome.runtime.getURL('static/js/injected.js');
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

document.addEventListener('DOMContentLoaded', function () {
  console.log('加载插件')
  
  setTimeout(() => {
    addExtension();
  }, 1000);
});

window.addEventListener("pushState", function (e) {
  console.log('pushstate')
  const id = window.location.pathname.match(/.*explore\/(.*)/)[1];
  id && window.location.reload();
});

let isFirstMsg = true;
window.addEventListener("message", function (e) {
  const result = e.data;
  const { type, message } = result;
  if (type !== 'inject_message_type') return;
  if (isFirstMsg) {
    window.__cache_comments = result;
  }
  isFirstMsg = false;
}, false);

var addExtension = () => {
  const id = window.location.pathname.match(/.*explore\/(.*)/)[1];
  console.log('id', id);
  if (!id) {
    return;
  }
  const injectExtensionEl = document.querySelector('#ai-extension-x');
  if (injectExtensionEl) {
    return;
  }
  const extension = document.createElement('div');
  extension.id = 'ai-extension-x';
  const root = document.querySelector('.note-detail-mask')
  root.appendChild(extension);

  const rootR = ReactDOM.createRoot(document.getElementById('ai-extension-x'));
  rootR.render(
    <React.StrictMode>
      <AITip />
    </React.StrictMode>
  );
}





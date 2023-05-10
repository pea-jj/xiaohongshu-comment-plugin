import React from 'react';
import ReactDOM from 'react-dom/client';
import AITip from './components/AITip';
import SlefMessageAutoReply from './components/SlefMessageAutoReply';
import { getBizType } from './utils/index';

const BIZ_TYPE = getBizType();

// 注入hack脚本
const s = document.createElement('script');
// must be listed in web_accessible_resources in manifest.json
s.src = window.chrome.runtime.getURL('static/js/injected.js');
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);


document.addEventListener('DOMContentLoaded', function () {
  // 延时加载面板 等待主dom
  console.log('加载插件', BIZ_TYPE);
  if (BIZ_TYPE === 'NOTE') {
    setTimeout(() => {
      addReplyPanel();
    }, 1000);
  }

  if (BIZ_TYPE === 'SELF_MESSAGE') {
    setTimeout(() => {
      addSelfMessageProcess();
    }, 2000);
  }
});

if (BIZ_TYPE === 'NOTE') {
  window.addEventListener("pushState", function (e) {
    console.log('pushstate')
    const id = window.location.pathname.match(/.*explore\/(.*)/)?.[1];
    id && window.location.reload();
  });
}

// 缓存消息消息
if (BIZ_TYPE === 'NOTE' || BIZ_TYPE === 'SELF_MESSAGE') {
  let isFirstMsg = true;
  window.addEventListener("message", function (e) {
    const result = e.data;
    const { type } = result;
    // console.log('xxx', type, result.message)
    if (type === 'COMMENT_LIST') {
      // 缓存评论
      if (isFirstMsg) {
        window.__cache_comments = result;
      }
      isFirstMsg = false;
    } else if (type === 'ME' && result?.message?.data?.nickname) {
      window.__cache_nickname = result?.message?.data?.nickname;
    } else if (type === 'PRO_ME' && result?.message?.data?.kolApply?.userName) {
      window.__cache_nickname = result?.message?.data?.kolApply?.userName;
    }
  }, false);
}

const addReplyPanel = () => {
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
  const root = document.querySelector('.note-detail-mask') || document.querySelector('.outer-link-container')
  root.appendChild(extension);

  const rootR = ReactDOM.createRoot(document.getElementById('ai-extension-x'));
  rootR.render(
    <React.StrictMode>
      <AITip />
    </React.StrictMode>
  );
}

const addSelfMessageProcess = () => {
  const injectExtensionEl = document.querySelector('#ai-extension-x');
  if (injectExtensionEl) {
    return;
  }
  const extension = document.createElement('div');
  extension.id = 'ai-extension-x';
  const root = document.querySelector('.reply-container .brand-name')
  if (!root) {
    setTimeout(() => {
      addSelfMessageProcess();
    }, 1000);
    return;
  }
  root.appendChild(extension);

  const rootR = ReactDOM.createRoot(document.getElementById('ai-extension-x'));
  rootR.render(
    <React.StrictMode>
      <SlefMessageAutoReply />
    </React.StrictMode>
  );
}





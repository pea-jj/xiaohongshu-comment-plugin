import React from 'react';
import ReactDOM from 'react-dom/client';
import AITip from './components/AITip';
import SlefMessageAutoReply from './components/SlefMessageAutoReply';
import Account from './components/Account';
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

  if (BIZ_TYPE === 'ACCOUNT') {
    setTimeout(() => {
      addAccountPanel();
    }, 1000);
  }
});

if (BIZ_TYPE === 'NOTE') {
  window.addEventListener("pushState", function (e) {
    console.log('pushstate', window.location.pathname, e)
    const id = window.location.pathname.match(/.*(explore|search_result)\/(.*)/)?.[2];
    // const id = window.location.pathname.match(/.*(explore)\/(.*)/)?.[2];

    if (id) {
      window.location.href = `https://www.xiaohongshu.com/explore/${id}`
    };
  });
}

// 缓存消息消息
let isFirstMsg = true;
window.addEventListener("message", function (e) {
  const result = e.data;
  const { type } = result;
  if (type === 'COMMENT_LIST') {
    // 缓存评论
    if (isFirstMsg) {
      window.__cache_comments = result;
    }
    isFirstMsg = false;
  } else if (type === 'NOTE_LIST') {
    window.__note_list = result.message?.data?.notes;
  } else if (type === 'ME' && result?.message?.data?.nickname) {
    window.__cache_nickname = result?.message?.data?.nickname;
    window.__cache_userId = result?.message?.data?.user_id;
  } else if (type === 'PRO_ME_V2' && result?.message?.data?.nickName) {
    window.__cache_nickname = result?.message?.data?.nickName;
  }
}, false);

const addReplyPanel = () => {
  const id = window.location.pathname.match(/.*(explore|search_result)\/(.*)/)?.[2];;
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
  if (!root) {
    setTimeout(() => {
      addReplyPanel();
    }, 1000);
    return;
  }
  root?.appendChild(extension);
  

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

const addAccountPanel = () => {
  const injectExtensionEl = document.querySelector('#ai-extension-x');
  console.log('injectExtensionEl', injectExtensionEl)
  if (injectExtensionEl) return;
  const extension = document.createElement('div');
  extension.id = 'ai-extension-x';
  const root = document.querySelector('.user-page .user')
  console.log('root', root)
  if (!root) {
    setTimeout(() => {
      console.log('循环')
      addAccountPanel();
    }, 1000);
    return;
  }
  root.appendChild(extension);

  const rootR = ReactDOM.createRoot(document.getElementById('ai-extension-x'));
  rootR.render(
    <React.StrictMode>
      <Account />
    </React.StrictMode>
  );
}

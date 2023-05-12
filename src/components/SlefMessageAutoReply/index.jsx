import React, { useEffect, useRef, useState } from 'react';
import {  Modal } from 'antd';
import { sleepTime, getParameterByName, getRandomReply } from '../../utils/index';
import useVerify from '../../hooks/verify';
import './index.css';

function SlefMessageAutoReply() {
  const [globalConfig, setGlobalConfig] = useState({});
  const [nickName, setNickName] = useState(window.__cache_nickname || ''); // 当前用户名
  const [modal, contextModalHolder] = Modal.useModal();
  const getGlobalConfigRef = useRef({});
  const activeChatBoxRef = useRef({});
  const hasReplyListRef = useRef([]);
  const stopFigRef = useRef(false);
  const { access } = useVerify(nickName);
  const { selfMessageSwitch, selfMessageContent } = globalConfig;

  const currentAccess = access?.includes('SELF_MESSAGE');

  // 获取全局公共配置
  const getGlobalConfig = () => {
    return new Promise((resolve) => {
      window.chrome.runtime.sendMessage({
        type: 'getGlobalConfig'
      }, function(response) {
        const globalConfig = response.globalConfig;
        getGlobalConfigRef.current = globalConfig;
        resolve(globalConfig)
      });
    })
  }

  useEffect(() => {
    getGlobalConfig().then(config => {
      setGlobalConfig(config);
    })
  }, []);

  useEffect(() => {
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message } = result;
      if (type !== 'PRO_ME_V2') return;
      message?.data?.nickName && setNickName(message?.data?.nickName);
    }, false);
  }, []);

  // 接收injectjs消息，查询新消息
  useEffect(() => {
    const fn = function (e) {
      const result = e.data;
      const { type, message } = result;
      const { selfMessageSwitch, selfMessageContent } = getGlobalConfigRef.current;
      if (stopFigRef.current || type !== 'CHAT_LIST' || !selfMessageSwitch || !selfMessageContent || !currentAccess) return;
      const { chatbox_list } = message.data;
      chatbox_list.forEach((item, i) => item.kIndex = i);
      const list = chatbox_list.filter(item => item.last_store_id > item.view_store_id);
      console.log('开始批处理', list)
      if (list?.length) {
        autoSendMsg(list);
      }
    }
    window.addEventListener("message", fn, false);
    return () => {
      window.removeEventListener("message", fn);
    }
  }, [currentAccess]);

  // 获取当前激活对话信息
  useEffect(() => {
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message, _url } = result;
      if (type !== 'CHAT_BOX') return;
      const activeChatBoxMsgList = message.data;
      const chatUserId = getParameterByName('chat_user_id', _url)
      activeChatBoxRef.current = {
        chatUserId,
        chatBoxMsgList: activeChatBoxMsgList,
      }
    }, false);
  }, []);

  // 自动回复私信
  const autoSendMsg = (list) => {
    const instance = modal.success({
      title: `注意`,
      content: `你收到${list.length}位用户新消息，正在处理，请稍等... ...`,
    });
    stopFigRef.current = true;
    const pList = list.map((item) => {
      const { kIndex, user_id } = item;
      return () => new Promise((r) => {
        const contentLeftItem = document.querySelector(`.contact-list-wrapper>.contact-item:nth-child(${kIndex + 1})`);
        contentLeftItem.click();
        r();
      }).then(() => {
        return sleepTime(3000);
      }).then(() => {
        const { chatUserId, chatBoxMsgList } = activeChatBoxRef.current;
        console.log(chatUserId, user_id, chatBoxMsgList);
        if (chatUserId !== user_id) return;
        if (hasReplyListRef.current.includes(chatUserId)) return;
        hasReplyListRef.current.push(chatUserId);
        let hasReply = false;
        for (let index = 0; index < chatBoxMsgList.length; index++) {
          const { message_type, receiver_id, content } = chatBoxMsgList[index];
          if (message_type === 'BLANK' || content.includes('我们已相互关注')) {
            continue;
          }
          if (receiver_id === chatUserId) {
            console.log('aaa', receiver_id)
            hasReply = true;
            break;
          }
        }
        if (hasReply) return;
        const commentInputEl = document.querySelector('.pm-input .input-area')
        commentInputEl.focus();
        const text = getRandomReply(getGlobalConfigRef.current.selfMessageContent);
        commentInputEl.value = text;
        commentInputEl.dispatchEvent(new CustomEvent('input'));
        commentInputEl.dispatchEvent(new CustomEvent('change'));

        // 创建一个新的 KeyboardEvent 对象，模拟回车键按下
        const enterKeyEvent = new KeyboardEvent('keypress', {
          bubbles: true, // 事件是否应冒泡
          cancelable: true, // 事件是否可以被取消
          keyCode: 13, // 回车键的 keyCode 是 13
          key: 'Enter',
        });

        // 在 input 元素上触发回车键事件
        commentInputEl.dispatchEvent(enterKeyEvent);
      }).then(() => {
        return sleepTime(1000);
      })
    })
    pList.reduce((chain, promise) => {
      return chain
        .then(() => promise())
    }, Promise.resolve())
      .finally(() => {
        console.log('结束')
        stopFigRef.current = false;
        instance.destroy();
      });
  }

  return (
    <span className='self-message-tip'>
      {contextModalHolder}
      { currentAccess ? ((selfMessageSwitch && selfMessageContent) ? '已开启' : '未开启') + '自动回复' : '验证秘钥中'}
    </span>
  );
}

export default SlefMessageAutoReply;

import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import { sleepTime, getParameterByName, getRandomReply } from '../../utils/index';
import useVerify from '../../hooks/verify';
import './index.css';

function SlefMessageAutoReply() {
  const [globalConfig, setGlobalConfig] = useState({}); // 全局配置
  const getGlobalConfigRef = useRef({}); // 全局配置
  const [nickName, setNickName] = useState(window.__cache_nickname || ''); // 当前用户名
  const activeChatBoxRef = useRef({}); // 当前的对话框
  const hasReplyListRef = useRef([]); // 当前窗口回复过的集合，回复过不会再次回复
  const stopFigRef = useRef(false); // 停止监听消息列表
  const emptyCheckRef = useRef(false); // 空闲检测 补偿未回复的消息
  const inCheckRef = useRef(false); // 是否在检测中
  const { access } = useVerify(nickName); // 权限
  const { selfMessageSwitch, selfMessageContent, selfMessageImage } = globalConfig;

  const [modal, contextModalHolder] = Modal.useModal();
  const currentAccess = access?.includes('SELF_MESSAGE');
  const currentImageAccess = access?.includes('SELF_MESSAGE_IMAGE');
  const hasMessageContent = !!(selfMessageContent || selfMessageImage);

  // 获取全局公共配置
  const getGlobalConfig = () => {
    return new Promise((resolve) => {
      window.chrome.runtime.sendMessage({
        type: 'getGlobalConfig'
      }, function (response) {
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
      const { selfMessageSwitch, selfMessageContent, selfMessageImage } = globalConfig;
    
      const hasMessageContent = !!(selfMessageContent || selfMessageImage);
      console.log('jianting', hasMessageContent, currentAccess)
      if (stopFigRef.current || type !== 'CHAT_LIST' || !selfMessageSwitch || !hasMessageContent || !currentAccess) return;
      const { chatbox_list } = message.data;
      chatbox_list.forEach((item, i) => item.kIndex = i);
      const list = chatbox_list.filter(item => item.last_store_id > item.view_store_id);
      console.log('开始批处理', list)
      if (list?.length) {
        autoSendMsg(list);
      } else {
        // autoSendMsg()
        if (!inCheckRef.current) {
          refreshCheckFlag();
        }
        if (emptyCheckRef.current) {
          autoSendMsg(chatbox_list.slice(0, 6));
          emptyCheckRef.current = false;
          refreshCheckFlag();
        }
      }
    }
    window.addEventListener("message", fn, false);
    return () => {
      window.removeEventListener("message", fn);
    }
  }, [currentAccess, globalConfig]);

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

  const refreshCheckFlag = () => {
    inCheckRef.current = true;
    setTimeout(() => {
      emptyCheckRef.current = true;
      inCheckRef.current = false;
    }, 3 * 60 * 1000);
  }

  const sendText = (text) => {
    if (!text) return;
    const commentInputEl = document.querySelector('.pm-input .input-area')
    commentInputEl.focus();
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
  }

  // 自动回复私信
  const autoSendMsg = (list) => {
    const instance = modal.success({
      title: `注意`,
      content: `程序正在处理，请稍等... ...`,
    });
    stopFigRef.current = true;
    const { selfMessageContent, selfMessageImage } = getGlobalConfigRef.current;
    const pList = list.map((item) => {
      const { kIndex, user_id } = item;
      return () => Promise.resolve()
        .then(() => {
          const contentLeftItem = document.querySelector(`.contact-list-wrapper>.contact-item:nth-child(${kIndex + 1})`);
          contentLeftItem.click();
          return sleepTime(3000);
        }).then(() => {
          const { chatUserId, chatBoxMsgList } = activeChatBoxRef.current;
          console.log(chatUserId, user_id, chatBoxMsgList);
          if (chatUserId !== user_id) {
            throw new Error();
          };
          if (hasReplyListRef.current.includes(chatUserId)) {
            throw new Error();
          };
          hasReplyListRef.current.push(chatUserId);
          let hasReply = false;
          for (let index = 0; index < chatBoxMsgList.length; index++) {
            const { message_type, receiver_id, content } = chatBoxMsgList[index];
            if (message_type === 'BLANK' || content.includes('我们已相互关注')) {
              continue;
            }
            if (receiver_id === chatUserId) {
              hasReply = true;
              break;
            }
          }
          if (hasReply) {
            throw new Error();
          };
          sendText(getRandomReply(selfMessageContent));
          return sleepTime(1000);
        }).then(() => {
          if (currentImageAccess) {
            selfMessageImage && sendText('<image> ' + selfMessageImage);
            return sleepTime(1000);
          }
        }).catch(() => {
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
      {currentAccess ? ((selfMessageSwitch && hasMessageContent) ? '已开启' : '未开启') + '自动回复' : '验证秘钥中'}
    </span>
  );
}

export default SlefMessageAutoReply;

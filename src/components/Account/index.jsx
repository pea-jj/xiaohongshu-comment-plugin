import React, { useEffect, useMemo, useState } from 'react';
import { Button, message, Modal, Form, Select } from 'antd';
import useVerify from '../../hooks/verify';
import './index.css';

function Account() {
  const [nickName, setNickName] = useState(window.__cache_nickname || ''); // 当前用户名
  const [globalConfig, setGlobalConfig] = useState({}); // background全局配置
  const [noteList, setNoteList] = useState(window.__note_list || []); // 所有评论
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [modal, contextModalHolder] = Modal.useModal();
  const [messageApi, contextHolder] = message.useMessage();
  const { access } = useVerify(nickName);
  const currentAccess = access?.includes('COMMENT');
  const [form] = Form.useForm();

  // 接收injectjs消息，抓取评论列表
  useEffect(() => {
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message } = result;
      if (type !== 'NOTE_LIST') return;
      const { notes } = message.data;
      setNoteList((_) => [..._, ...notes]);
    }, false);
  }, []);

  useEffect(() => {
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message } = result;
      if (type !== 'ME') return;
      const { nickname } = message.data;
      setNickName(nickname);
    }, false);
  }, []);

  const notesSelectOptions = useMemo(() => {
    return noteList.map(item => {
      return {
        value: item.note_id,
        label: item.display_title + `[喜欢：${item?.interact_info?.liked_count}]`
      };
    })
  }, [noteList]);

  // 获取全局公共配置
  const getGlobalConfig = () => {
    return new Promise((resolve) => {
      window.chrome.runtime.sendMessage({
        type: 'getGlobalConfig'
      }, function (response) {
        const globalConfig = response.globalConfig;
        resolve(globalConfig)
      });
    })
  }

  // 全局变量
  useEffect(() => {
    getGlobalConfig().then(config => {
      setGlobalConfig(config);
    })
  }, []);

  const startAutoReplyTask = () => {
    const { replyType, commentsReplyContent } = globalConfig
    if (replyType !== 'RANDOM') {
      messageApi.open({
        type: 'fail',
        content: '评论回复类型必须选择固定话术哦~请更改配置',
      });
      return;
    }
    if (!commentsReplyContent) {
      messageApi.open({
        type: 'fail',
        content: '固定话术未填写~请更改配置',
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleOk = () => {
    const { notes } = form.getFieldsValue();
    notes.length && window.chrome.runtime.sendMessage({
      type: 'autoCommentReply',
      data: notes,
    }, function (response) {
      console.log('任务结束', response)
      setIsModalOpen(false);
    });
  }

  if (!currentAccess) return (
    <div style={{
      marginLeft: 30,
      color: 'red',
    }}>{nickName ? '验证秘钥中' : '找不到登录信息'}</div>
  );

  return (
    <div className='start-auto-reply-wrapper'>
      {contextHolder}
      {/* {contextModalHolder} */}
      {currentAccess && (
        <>
          <Button type="primary" onClick={startAutoReplyTask}>自动回复评论</Button>
          <Modal title="选择你要自动回复的笔记" open={isModalOpen} onOk={handleOk} onCancel={() => setIsModalOpen(false)} cancelText="取消" okText="确认">
            <Form
              form={form}
              labelCol={{
                span: 6,
              }}
              wrapperCol={{
                span: 18,
              }}
              layout="horizontal"
              size='small'
            >
              <Form.Item label="" name="notes">
                <Select 
                  options={notesSelectOptions || []}
                  mode="multiple"
                />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
}

export default Account;

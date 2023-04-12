import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Card, Space, message } from 'antd';
import { cloneDeep } from 'lodash';
import { getAiReplyList } from '../../api';
import './index.css';

const pageSize = 20;
function AiTip() {
  const [me, setMe] = useState(''); // 当前用户id
  const [commentList, setCommentList] = useState([]); // 所有评论
  const [filterCommentList, setFilterCommentList] = useState([]); // 过滤后、待回复评论
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const [noteMainContent, setNoteMainContent] = useState(''); // 笔记标题
  const [messageApi, contextHolder] = message.useMessage();

  // 表格配置
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      render: (_, record) => record.index + 1,
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: '我的回复',
      dataIndex: 'reply',
      key: 'reply',
      width: '40%',
      render: (_, record) => (
        <div>
          {<Input.TextArea value={record.reply} onChange={(e) => replyInputChange(record.id, e)} autoSize />}
        </div>
      ),
    },
  ];

  // 接收消息，抓取评论列表
  useEffect(() => {
    let index = 0;
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message } = result;
      if (type !== 'inject_message_type') return;
      const { comments, user_id } = message.data;
      setMe(user_id);
      setCommentList((_) => [..._, ...comments.map(v => {
        v.kPage = index;
        return v;
      })]);
      index++;
    }, false);
  }, []);

  useEffect(() => {
    setNoteMainContent(document.querySelector('.note-content>.desc')?.innerText || '');
  }, []);

  // 过滤评论列表，表格中展示内容
  useEffect(() => {
    let temp = commentList.filter(v => !v.content.includes('@'));
    temp = temp.filter(v => {
      const { user_id } = v.user_info; // 当前评论用户
      if (me === user_id) return false;
      return v?.sub_comments?.every(subItem => subItem?.user_info?.user_id !== me);
    })
    temp.forEach((v, index) => v.index = index);
    setFilterCommentList(temp);
  }, [commentList]);

  // 获取智能回复
  const autoReply = () => {
    const startIndex = (current - 1) * pageSize;
    const lastIndex = current * pageSize;
    const currentPageData = filterCommentList.slice(startIndex, lastIndex);
    const list = cloneDeep(currentPageData);
    const noteTitle = document.querySelector('.note-content .title')?.innerText || '';
    setLoading(true);
    getAiReplyList({
      noteTitle,
      noteMainContent: noteMainContent,
      commentList: list
    }).then(res => {
      setLoading(false);
      const replyStr = res.data?.data;
      if (!replyStr) {
        // 抛异常
        return;
      };
      const replyList = replyStr.split(/\d{0,2}\. /);
      replyList.shift();
      console.log('replylist', replyList)
      if (replyList.length !== list.length) {
        // 抛异常
        return;
      }

      for (let i = startIndex, j = 0; i < startIndex + replyList.length; i++, j++) {
        filterCommentList[i].reply = replyList[j];
      }
      setFilterCommentList([...filterCommentList]);
    }).catch(e => {
      console.log(e);
      setLoading(false);
    })
  }

  const autoSendReply = async () => {
    let i = 0;
    for (let index = 0; index < filterCommentList.length; index++) {
      const { id, content, reply, hasReply } = filterCommentList[index];
      if (reply && !hasReply) {
        console.log(`处理第${i}条`, id, content, reply, hasReply, new Date().getTime());
        const index = commentList.findIndex(t => t.id === id);
        console.log('father', commentList, index)
        sendSingleItem(index, reply);
        filterCommentList[index].hasReply = true;
        i++;
        // 异步 防封
        await new Promise((r) => {
          setTimeout(() => {
            r();
          }, 5000);
        })
      }
    }
    i && messageApi.open({
      type: 'success',
      content: `处理完成，共发送${i}条回复`,
    });
  }

  const sendSingleItem = (index, content) => {
    if (!content) return;
    const commentItem = document.querySelector(`.comments-container>.list-container>.comment-item:nth-child(${index + 1})`);
    const replyIconEl = commentItem.querySelector('.right>.info>.interactions>.reply');
    replyIconEl.click();
    // 赋值
    document.querySelector('.comment-wrapper').classList.add('active');
    const commentInputEl = document.querySelector('.comment-input');
    commentInputEl.focus();
    commentInputEl.value = content;
    commentInputEl.dispatchEvent(new CustomEvent('input'));
    commentInputEl.dispatchEvent(new CustomEvent('change'));
     // 提交
     const submitEl = document.querySelector('.comment-wrapper button.submit');
     submitEl.click();
  }

  const replyInputChange = (id, e) => {
    const current = filterCommentList.find(v => v.id === id);
    current.reply = e.target.value;
    setFilterCommentList([...filterCommentList]);
  }

  const inputOnChange = (e) => {
    setNoteMainContent(e.target.value);
  }

  const tableChange = (pagination) => {
    const { current } = pagination;
    setCurrent(current);
  }

  return (
    <div className='ai-tip-wrapper'>
      {contextHolder}
      <Card size="small" title="笔记内容">
        <Input.TextArea value={noteMainContent} placeholder="描述写下笔记的主要内容" bordered={false} onChange={inputOnChange} />
      </Card>
      <div></div>
      <Space wrap style={{ margin: '20px 0' }}>
        <Button onClick={autoReply} type="primary" loading={loading}>{loading ? '加速思考中' : '生成智能回复'}</Button>
        <Button onClick={autoSendReply} type="primary">自动发送评论</Button>
      </Space>

      <Table
        className='ai-tip-table'
        columns={columns}
        dataSource={filterCommentList}
        size="small"
        pagination={{
          pageSize,
          showSizeChanger: false,
          position: ["topRight", "none"]
        }}
        onChange={tableChange} />
    </div>
  );
}

export default AiTip;

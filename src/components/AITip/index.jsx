import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Card, Space, message, ConfigProvider, Modal } from 'antd';
// import { InfoCircleOutlined } from '@ant-design/icons';
import { cloneDeep } from 'lodash';
import { getAiReplyList } from '../../api';
import useVerify from '../../hooks/verify';
import { getRandomReply, sleepTime, getParameterByName } from '../../utils/index';
import FollowBtn from './Follow';
import './index.css';

const pageSize = 20;
let index = 0;

function AiTip() {
  const [me, setMe] = useState(''); // 当前用户id
  const [nickName, setNickName] = useState(window.__cache_nickname || ''); // 当前用户名
  const [globalConfig, setGlobalConfig] = useState({}); // background全局配置
  const [commentList, setCommentList] = useState([]); // 所有评论
  const [filterCommentList, setFilterCommentList] = useState([]); // 过滤后、待回复评论
  const [current, setCurrent] = useState(1); // 页数
  const [loading, setLoading] = useState(false); // 智能回复按钮loading
  const [zCommentsQueryCount, setZCommentsQueryCount] = useState(0);
  const [noteMainContent, setNoteMainContent] = useState(''); // 笔记标题
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, contextModalHolder] = Modal.useModal();
  const { access } = useVerify(nickName);
  const currentAccess = access?.includes('COMMENT');
  const currentFollowAccess = access?.includes('FOLLOW');
  const isStartAutoReply = getParameterByName('_s');

  // 表格配置
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      render: (_, record) => record.index + 1,
    },
    {
      title: '评论人',
      dataIndex: 'user_info.nickname',
      key: 'nickName',
      render: (_, record) => record.user_info.nickname,
    },
    {
      title: '评论时间',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (_, record) => {
        var date = new Date(record.create_time);
        // 获取月份、日期和分钟
        var month = date.getMonth() + 1; // 月份从0开始，所以要加1
        var day = date.getDate();
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var formattedDate = month + "/" + day + " " + hour + ":" + minutes;
        return formattedDate;
      },
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      width: 150,
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

  // 拿缓存的数据（第一页）
  useEffect(() => {
    if (window.__cache_comments) {
      const { message } = window.__cache_comments;
      const { comments, user_id } = message.data;
      setMe(user_id);
      setCommentList((_) => [..._, ...comments.map(v => {
        v.kPage = index;
        return v;
      })]);
      index++;
    }
  }, []);

  // 接收injectjs消息，抓取评论列表
  useEffect(() => {
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message } = result;
      if (type !== 'COMMENT_LIST') return;
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
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message } = result;
      if (type !== 'ME') return;
      const { nickname } = message.data;
      setNickName(nickname);
    }, false);
  }, []);

  // 主要内容自动同步input
  useEffect(() => {
    setNoteMainContent(document.querySelector('.note-content>.desc')?.innerText || '');
  }, []);

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

  // 修改页面样式 使得插件宽度足够
  useEffect(() => {
    if (document.querySelector('.interaction-container')) {
      document.querySelector('.interaction-container').style.width = '250px'
    }
    if (document.querySelector('.media-container')) {
      document.querySelector('.media-container').style.width = '100px'
    }
    if (document.querySelector('.side-bar')) {
      document.querySelector('.side-bar').style.flexBasis = '100px'
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (!access?.length) return;
    if (zCommentsQueryCount > 15) return;
    if (!document.querySelector('.end-container')) {
      setTimeout(() => {
        if (document.querySelector('.note-scroller')) {
          console.log('xx', document.querySelector('.note-scroller').scrollHeight)
          // document.querySelector('.note-scroller').scrollTop = document.querySelector('.note-scroller').scrollHeight
          const noteScroller = document.querySelector('.note-scroller');

          noteScroller.scrollTo({
            top: noteScroller.scrollHeight + 1,
            behavior: 'smooth'
          });
        }
        setZCommentsQueryCount(zCommentsQueryCount + 1);
      }, 2500);
    }
  }, [zCommentsQueryCount, currentAccess, currentFollowAccess]);


  useEffect(() => {
    if (!isStartAutoReply) return;
    (async function() {
      await sleepTime(180000 + Number(isStartAutoReply || 0) * 1000);
      // getSolidReply();
      document.getElementById('solid')?.click();
      await sleepTime(2000);
      // await autoSendAIReply();
      document.getElementById('send')?.click();
      await sleepTime(30000);
      window.location.reload();
    })();
  }, []);



  // 过滤评论列表，表格中展示内容
  useEffect(() => {
    if (!commentList?.length) return;
    // const { commentNumLimit } = globalConfig;

    let temp = commentList.filter(v => !v.content.includes('@'));
    // temp = temp.filter(v => v.content.length > commentNumLimit);
    temp = temp.filter(v => {
      const { user_id } = v.user_info; // 当前评论用户
      if (me === user_id) return false;
      return v?.sub_comments?.every(subItem => subItem?.user_info?.user_id !== me);
    })
    temp.forEach((v, index) => v.index = index);
    setFilterCommentList(temp);
  }, [commentList]);

  // 获取智能回复
  const getAIReply = async () => {
    const config = await getGlobalConfig();
    const { style = "1", tokenNumLimit = 15, followSwitch } = config;

    const startIndex = (current - 1) * pageSize;
    const lastIndex = current * pageSize;
    const currentPageData = filterCommentList.slice(startIndex, lastIndex);
    const list = cloneDeep(currentPageData);
    const noteTitle = document.querySelector('.note-content .title')?.innerText || '';
    setLoading(true);
    getAiReplyList({
      noteTitle,
      noteMainContent,
      // comments: list?.map((v, index) => (index + 1) + ' ' + v.content + '\n'),
      comments: JSON.stringify(list?.map(v => v.content)),
      commentsLength: list.length,
      style,
      tokenNumLimit,
      followSwitch,
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
      if (replyList.length < list.length) {
        // 抛异常
        messageApi.open({
          type: 'fail',
          content: '网络出小差了，请重试',
        });
        return;
      }

      for (let i = startIndex, j = 0; i < startIndex + list.length; i++, j++) {
        filterCommentList[i].reply = replyList[j];
      }
      setFilterCommentList([...filterCommentList]);
    }).catch(e => {
      console.log(e);
      setLoading(false);
    })
  }

  const getSolidReply = async () => {
    const config = await getGlobalConfig();
    const { commentsReplyContent } = config;
    for (let i = 0; i < filterCommentList.length; i++) {
      filterCommentList[i].reply = getRandomReply(commentsReplyContent);
    }
    setFilterCommentList([...filterCommentList]);
  }

  // 自动发送ai回复
  const autoSendAIReply = async () => {
    const result = filterCommentList.filter(item => item.reply && !item.hasReply);
    if (!result.length) return;
    const instance = modal.success({
      title: `共有${result.length}条回复待发送`,
      content: `共有${result.length}条回复待发送，请等待... ...`,
    });

    let i = 0;
    for (let index = 0; index < filterCommentList.length; index++) {
      const { id, content, reply, hasReply } = filterCommentList[index];
      if (reply && !hasReply) {
        console.log(`处理第${i}条`, id, content, reply, hasReply, filterCommentList[index], new Date().getTime());
        instance.update({
          content: `正在处理第${i + 1}条，请等待... ...`,
        });
        const domIndex = commentList.findIndex(t => t.id === id);
        // console.log('father', commentList, index)
        sendSingleItem(domIndex, reply);
        filterCommentList[index].hasReply = true;
        i++;
        // 异步 防封
        await sleepTime(3000 + Math.random() * 2000);
      }
    }
    instance.destroy();
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

  const customizeRenderEmpty = () => (
    //这里面就是我们自己定义的空状态
    <div style={{ textAlign: 'center' }}>
      {/* <InfoCircleOutlined style={{ fontSize: 20 }} /> */}
      <p>暂无评论数据，请注意你回复过的评论不会显示出来~</p>
    </div>
  );

  if (!access?.length) return (
    <div style={{
      marginLeft: 30,
      color: 'red',
    }}>{nickName ? '验证秘钥中' : '找不到登录信息'}</div>
  );

  return (
    <div className='ai-tip-wrapper'>
      {contextHolder}
      {contextModalHolder}
      {currentFollowAccess && <div><FollowBtn /></div>}
      {currentAccess && (
        <>
          {globalConfig.replyType === 'AI' && <Card size="small" title="笔记内容【ai是基于笔记内容去生成回复的，这里可以详细总结下你的笔记~】">
            <Input.TextArea value={noteMainContent} placeholder="描述写下笔记的主要内容" bordered={false} onChange={inputOnChange} />
          </Card>}
          <Space wrap style={{ margin: '20px 0' }}>
            { globalConfig.replyType === 'AI' && <Button onClick={getAIReply} type="primary" disabled={!filterCommentList?.length} loading={loading}>{loading ? '加速思考中' : '生成智能回复'}</Button>}
            { globalConfig.replyType === 'RANDOM' && <Button id="solid" onClick={getSolidReply} type="primary" disabled={!filterCommentList?.length} >生成固定话术回复</Button>}
            <Button id="send" onClick={autoSendAIReply} type="primary" disabled={!filterCommentList?.length}>自动发送回复{`(共${filterCommentList.filter(item => item.reply && !item.hasReply)?.length}条)`}</Button>
          </Space>
          <ConfigProvider renderEmpty={customizeRenderEmpty}>
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
              onChange={tableChange}
            />
          </ConfigProvider>
        </>
      )}


    </div>
  );
}

export default AiTip;

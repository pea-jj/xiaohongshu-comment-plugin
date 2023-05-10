import React, { useEffect, useState } from 'react';
import { Button, Modal } from 'antd';

export default () => {
  const [willFollowUserList, setWillFollowUserList] = useState([]);
  const [modal, contextModalHolder] = Modal.useModal();

   // 拿缓存的数据（第一页）
   useEffect(() => {
    if (window.__cache_comments) {
      const { message } = window.__cache_comments;
      const { comments } = message.data;
      setWillFollowUserList(_ => [..._, ...comments.map(v => v?.user_info?.user_id)])
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", function (e) {
      const result = e.data;
      const { type, message } = result;
      if (type !== 'COMMENT_LIST') return;
      const { comments } = message.data;
      setWillFollowUserList(_ => [..._, ...comments.map(v => v?.user_info?.user_id)])
    }, false);
  }, []);


  const createFollowTask = () => {
    modal.success({
      title: `关注任务开始`,
      content: `当前任务共有${Array.from(new Set(willFollowUserList)).length}位用户`,
    });
    willFollowUserList.length && window.chrome.runtime.sendMessage({
      type: 'follow',
      data: Array.from(new Set(willFollowUserList)),
    }, function (response) {
      console.log('关注任务结束', response)
    });
  }

  return (
    <>
      {contextModalHolder}
      <Button onClick={createFollowTask} type="primary" style={{ marginBottom: 10 }}>开启自动关注</Button>
    </>
  )
}
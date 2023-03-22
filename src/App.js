import React, { useEffect, useMemo, useState } from 'react';
import { getBasicData } from './api';
import './App.css';

// const mock = 'https://www.xiaohongshu.com/explore/63dcc4550000000002001156';

function App() {
  const [currentTab, setCurrentTab] = useState({});
  const [commentList, setCommentList] = useState([]);
  // const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState('');

  const uniqueId = useMemo(() => {
    const url = currentTab.url;
    if (!url) return '';
    const id = url.match(/.*explore\/(.*)/)[1];
    return id;
  }, [currentTab]);

  useEffect(() => {
    window.chrome.tabs?.getSelected(null, function (tab) {
      console.log('tab', tab);
      setCurrentTab(tab);
    });
  }, []);

  useEffect(() => {
    uniqueId && fetchCommentData(uniqueId);
  }, [uniqueId]);

  const fetchCommentData = (uniqueId, cursor = '') => {
    getBasicData({ uniqueId, cursor }, window.stealRequestHeaderInstance.getHeaders()).then((res) => {
      const result = res?.data?.data;
      const { comments, has_more: hasMore, cursor: c } = result || {};
      setCursor(hasMore ? c : '');
      setCommentList([...commentList, ...comments]);
    }).catch(e => {
      console.log(e);
    })
  }

  const reply = () => {

  }

  if (!window.chrome?.tabs) return null;

  return (
    <div className="App">
      <div>
        {uniqueId}
      </div>
      <div className='comments-wrapper'>
        {commentList.map(v => {
          const { id, content } = v;
          return (
            <div key={id}>
              <div>
                {content}
              </div>
              <div onClick={() => reply(id)}>
                回复
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default App;

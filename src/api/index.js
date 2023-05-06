import axios from 'axios';

export const getAiReplyList = (data) => {
  return axios({
    method: 'post',
    url: 'https://smooth.chat/chat/xiaohongshu-v2',
    // withCredentials: true,
    timeout: 60000,
    data,
  })
}

export const verifyKey = (key = '') => {
  return axios({
    method: 'post',
    url: 'https://smooth.chat/chat/xiaohongshu-verify',
    // withCredentials: true,
    timeout: 10000,
    data: {
      key: key.trim(), 
    },
  })
}


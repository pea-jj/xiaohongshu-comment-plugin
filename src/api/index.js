import axios from 'axios';

export const getAiReplyList = (data) => {
  return axios({
    method: 'post',
    url: 'https://smooth.chat/chat/xiaohongshu',
    // withCredentials: true,
    timeout: 60000,
    data,
  })
}

export const verifyKey = (key) => {
  return axios({
    method: 'post',
    url: 'https://smooth.chat/chat/xiaohongshu-verify',
    // withCredentials: true,
    timeout: 5000,
    data: {
      key, 
    },
  })
}


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


import axios from 'axios';

export const getAiReplyList = ({noteTitle, noteMainContent, commentList}) => {
  const completeContent = `如果你是一个小红书的博主，你发表了一篇笔记，笔记的标题为“${noteTitle}”，并附带了一些图片，图片内容为：“${noteMainContent}”。\n
  此时你收到了多位用户的评论(用数字索引分割)：\n
  ${commentList?.map((v, index) => (index + 1) + ' ' + v.content + '\n' )}
  你做为博主，请依次回复下这些用户，要求回复内容以数字索引（比如1. 2. 3.等等）分割，并且每条回复内容必须在30个字以内，回复需要充满真实感、亲切感、或幽默感`;
  return axios({
    method: 'post',
    url: 'https://smooth.chat/chat/normal',
    // withCredentials: true,
    timeout: 60000,
    data: {
      text: completeContent,
    }
  })
}


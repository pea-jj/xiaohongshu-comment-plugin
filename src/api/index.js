import axios from 'axios';

// const commonHeaders = {
//   'x-b3-traceid': '6697619403180d64',
//   'x-s': '1g1W0gak161KOj9WOj46s6dJs2TlZjkUsBAlsj9KOYT3',
//   'x-t': 1678434596170
// };

export const getBasicData = (options, headers) => {
  return axios({
    method: 'get',
    url: 'https://edith.xiaohongshu.com/api/sns/web/v2/comment/page',
    withCredentials: true,
    timeout: 10000,
    headers,
    params: {
      note_id: options.uniqueId,
      cursor: options.cursor
    }
  })
};

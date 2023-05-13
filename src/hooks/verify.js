import React, { useEffect, useState } from 'react';
import { verifyKey } from '../api/index';

export default function useVerify(nickName) {
  const [accessList, setAccessList] = useState([]);

  // 获取全局公共配置
  const getGlobalConfig = () => {
    return new Promise((resolve) => {
      window.chrome.runtime.sendMessage({
        type: 'getGlobalConfig'
      }, function(response) {
        const globalConfig = response.globalConfig;
        resolve(globalConfig)
      });
    })
  }

  useEffect(() => {
    nickName && getGlobalConfig().then(config => {
      return verifyKey(config.key)
    }).then(res => {
      const { isTest, access, user } = res?.data?.data || {};
      console.log('access result', access, user, nickName)
      setAccessList((isTest || user?.includes(nickName)) ? access : []);
      return (isTest || user?.includes(nickName)) ? access : [];
    });
  }, [nickName]);

  return {
    access: accessList
  }
}
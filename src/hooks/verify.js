import React, { useEffect, useState } from 'react';
import { verifyKey } from '../api/index';

export default function useVerify() {
  const [access, setAccess] = useState(false);

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
    getGlobalConfig().then(config => {
      return verifyKey(config.key)
    }).then(res => {
      setAccess(res?.data?.data)
      return res?.data?.data;
    })
  }, []);

  return {
    access
  }
}
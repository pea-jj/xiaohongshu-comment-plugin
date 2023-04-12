import React, { useEffect, useMemo, useState } from 'react';
import {
  Input,
  Switch,
  Form,
  InputNumber,
  Radio,
} from 'antd';
import './App.css';

function App() {

  const onFormLayoutChange = (values, allFields) => {
    const bg = window.chrome.extension.getBackgroundPage();
    bg.setGlobalConfig(allFields); // 访问bg的函数
  }

  return (
    <div className="App">
      <h1>工具配置</h1>
      <Form
        labelCol={{
          span: 6,
        }}
        wrapperCol={{
          span: 18,
        }}
        layout="horizontal"
        initialValues={{
          style: "默认",
          tokenNumLimit: 30,
          commentNumLimit: 2,
        }}
        onValuesChange={onFormLayoutChange}
        size='small'
        style={{
          maxWidth: 600,
        }}
      >
        <Form.Item label="秘钥" name="key">
          <Input />
        </Form.Item>
        <Form.Item label="回复风格" name="style">
          <Radio.Group>
            <Radio value="默认">默认</Radio>
            <Radio value="小女生">女生向</Radio>
            <Radio value="油腻男">油腻男向</Radio>
            <Radio value="行业老师">行业老师向</Radio>
            <Radio value="幽默">幽默</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="回复字数上限" name="tokenNumLimit">
          <InputNumber min={10} max={50} />
        </Form.Item>
        <Form.Item label="评论最少字数" name="commentNumLimit">
          <InputNumber min={0} max={20} />
        </Form.Item>
        <Form.Item label="求关注" name="followSwitch" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </div>
  );
}

export default App;

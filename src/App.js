import React from 'react';
import {
  Input,
  Switch,
  Form,
  InputNumber,
  Radio,
} from 'antd';
import { initialValues } from './constants/index';
import './App.css';

function App() {

  const onFormLayoutChange = (values, allFields) => {
    const bg = window.chrome.extension.getBackgroundPage();
    bg.setGlobalConfig(allFields); // 访问bg的函数
  }

  const getInitValues = () => {
    const bg = window.chrome.extension.getBackgroundPage();
    const config = bg.getGlobalConfig();
    return config;
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
        initialValues={getInitValues()}
        onValuesChange={onFormLayoutChange}
        size='small'
        style={{
          maxWidth: 600,
        }}
      >
        {/* <Form.Item label="秘钥" name="key">
          <Input />
        </Form.Item> */}
        <Form.Item label="回复风格" name="style">
          <Radio.Group>
            <Radio value="0">默认</Radio>
            <Radio value="1">可爱女生风</Radio>
            <Radio value="2">油腻男风</Radio>
            <Radio value="3">行业老师风</Radio>
            <Radio value="4">幽默风</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="回复字数上限" name="tokenNumLimit">
          <InputNumber min={10} max={50} />
        </Form.Item>
        <Form.Item label="低于最少字数不评论" name="commentNumLimit">
          <InputNumber min={0} max={20} />
        </Form.Item>
        <Form.Item label="求关注" name="followSwitch" valuePropName="checked" extra="会随机在回复中增加求关注的表达">
          <Switch />
        </Form.Item>
      </Form>
    </div>
  );
}

export default App;

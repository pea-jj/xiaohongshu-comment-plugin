import React from 'react';
import {
  Input,
  Switch,
  Form,
  InputNumber,
  Radio,
  notification,
  Button,
  Divider,
} from 'antd';
import './App.css';

function App() {
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();

  const onFormLayoutChange = (values, allFields) => {
    const bg = window.chrome.extension.getBackgroundPage();
    bg.setGlobalConfig(allFields); // 访问bg的函数
  }

  const getInitValues = () => {
    const bg = window.chrome.extension.getBackgroundPage();
    const config = bg.getGlobalConfig();
    return config;
  }

  // 测试私信回复
  const testSelfMessageContent = () => {
    const selfMessageContent = form.getFieldValue('selfMessageContent');
    if (!selfMessageContent) {
      window.alert('请填写固定话术')
      return;
    };
    const list = selfMessageContent.split(/[0-9]\. /);
    if (list.length > 1) {
      list.shift();
    }
    let randomIndex = Math.floor(Math.random() * list.length);
    api.info({
      message: '测试随机话术',
      description: list[randomIndex],
      placement: 'topRight',
    });
  }
  console.log('mmm', form.getFieldValue('replyType'));
  return (
    <div className="App">
      {contextHolder}
      <div className='mini-tip'>改变配置后记得刷新页面哦~</div>
      <Divider dashed />
      <Form
        form={form}
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
          maxWidth: 560,
        }}
      >
        <h5>秘钥(免费试用秘钥请联系博主哦~)</h5>
        <Form.Item label="秘钥" name="key">
          <Input />
        </Form.Item>
        <h5>评论回复配置</h5>
        <Form.Item label="回复方式" name="replyType">
          <Radio.Group>
            <Radio value="AI">AI</Radio>
            <Radio value="RANDOM">随机固定话术</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.replyType !== currentValues.replyType}
        >
          {({ getFieldValue }) =>
            getFieldValue('replyType') === 'RANDOM' ? (
              <Form.Item label="固定话术" name="commentsReplyContent" tooltip="多条话术随机展示，格式严格按照1. 2. 3. 索引来哦，注意有空格">
                <Input.TextArea placeholder="1. 思我下！ 2. 了解更多可以t我下" allowClear autoSize />
              </Form.Item>
            ) : (
              <>
                <Form.Item label="AI回复风格" name="style">
                  <Radio.Group>
                    <Radio value="0">默认</Radio>
                    <Radio value="1">可爱女生风</Radio>
                    <Radio value="2">油腻男风</Radio>
                    <Radio value="3">行业老师风</Radio>
                    <Radio value="4">幽默风</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item label="回复字数上限" name="tokenNumLimit" tooltip="回复字数上限">
                  <InputNumber min={3} max={30} />
                </Form.Item>
                <Form.Item label="求关注" name="followSwitch" valuePropName="checked" tooltip="会随机在回复中增加求关注的表达">
                  <Switch />
                </Form.Item>
              </>
            )
          }
        </Form.Item>
        {/* <Form.Item label="评论过滤字数" name="commentNumLimit" tooltip="低于xx字数不评论">
          <InputNumber min={0} max={20} />
        </Form.Item> */}
        <h5>私信配置</h5>
        <Form.Item label="自动回复" name="selfMessageSwitch" valuePropName="checked" tooltip="是否开启私信自动回复">
          <Switch />
        </Form.Item>
        <Form.Item label="固定话术" name="selfMessageContent" tooltip="多条话术随机展示，格式严格按照1. 2. 3. 索引来哦，注意有空格">
          <Input.TextArea placeholder="1. 你好呀~加xxxxxx可以了解更多哦！ 2. 加群" allowClear autoSize />
        </Form.Item>
        <Button onClick={testSelfMessageContent} style={{ marginLeft: 140 }}>点我测试随机话术</Button>
      </Form>
    </div>
  );
}

export default App;

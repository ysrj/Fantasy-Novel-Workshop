import { Card, Form, Input, Select, Button, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

function Settings(): JSX.Element {
  const handleSave = (): void => {
    message.success('设置已保存')
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>

      <Card title="基本设置" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="数据存储路径">
            <Input placeholder="默认: 用户文档目录/FNW" disabled />
          </Form.Item>
          <Form.Item label="自动保存间隔">
            <Select defaultValue="30">
              <Select.Option value="10">10秒</Select.Option>
              <Select.Option value="30">30秒</Select.Option>
              <Select.Option value="60">1分钟</Select.Option>
              <Select.Option value="300">5分钟</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="编辑器设置" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="字体大小">
            <Select defaultValue="16">
              <Select.Option value="14">14px</Select.Option>
              <Select.Option value="16">16px</Select.Option>
              <Select.Option value="18">18px</Select.Option>
              <Select.Option value="20">20px</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="字体">
            <Select defaultValue="monospace">
              <Select.Option value="monospace">等宽字体</Select.Option>
              <Select.Option value="sans">无衬线体</Select.Option>
              <Select.Option value="serif">衬线体</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="主题">
            <Select defaultValue="light">
              <Select.Option value="light">浅色</Select.Option>
              <Select.Option value="dark">深色</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="AI设置（可选）">
        <Form layout="vertical">
          <Form.Item label="Ollama地址">
            <Input placeholder="http://localhost:11434" />
          </Form.Item>
          <Form.Item label="AI模型">
            <Select placeholder="选择本地模型">
              <Select.Option value="llama2">llama2</Select.Option>
              <Select.Option value="qwen">qwen</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存设置
        </Button>
      </div>
    </div>
  )
}

export default Settings

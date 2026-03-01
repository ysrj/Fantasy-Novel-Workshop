import { Card, message } from 'antd'
import { BookOutlined, EditOutlined, BulbOutlined } from '@ant-design/icons'

function Analysis(): JSX.Element {
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>分析与学习</h2>

      <Card
        title={
          <span>
            <BookOutlined style={{ marginRight: 8 }} />
            拆书工具
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <p>分析经典玄幻作品的结构、人物和文笔，学习优秀写作技巧。</p>
        <p style={{ color: '#999', marginTop: 8 }}>功能开发中，敬请期待...</p>
      </Card>

      <Card
        title={
          <span>
            <EditOutlined style={{ marginRight: 8 }} />
            仿写练习
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <p>提供范例段落供模仿练习，提升写作水平。</p>
        <p style={{ color: '#999', marginTop: 8 }}>功能开发中，敬请期待...</p>
      </Card>

      <Card
        title={
          <span>
            <BulbOutlined style={{ marginRight: 8 }} />
            仿写对比
          </span>
        }
      >
        <p>对比原文和仿写内容，整合改进。</p>
        <p style={{ color: '#999', marginTop: 8 }}>功能开发中，敬请期待...</p>
      </Card>
    </div>
  )
}

export default Analysis

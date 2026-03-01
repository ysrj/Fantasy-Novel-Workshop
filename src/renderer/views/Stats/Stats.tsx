import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Statistic, Row, Col, Progress, message } from 'antd'
import { ReadOutlined, EditOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons'

interface StatsData {
  totalWordCount: number
  chapterWordCounts: Record<string, number>
  dailyProgress: { date: string; wordCount: number }[]
  targetWordCount: number
}

function Stats(): JSX.Element {
  const { projectId } = useParams()
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    if (projectId) {
      loadStats()
    }
  }, [projectId])

  const loadStats = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<StatsData>('stats:get', projectId)
      setStats(data)
    } catch (error) {
      message.error('加载统计失败')
    }
  }

  if (!stats) {
    return <div>加载中...</div>
  }

  const progressPercent = Math.min(
    Math.round((stats.totalWordCount / stats.targetWordCount) * 100),
    100
  )

  const todayProgress = stats.dailyProgress.find(
    (p) => p.date === new Date().toISOString().split('T')[0]
  )

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>写作统计</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总字数"
              value={stats.totalWordCount}
              prefix={<ReadOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="目标字数"
              value={stats.targetWordCount}
              prefix={<EditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日字数"
              value={todayProgress?.wordCount || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="写作天数"
              value={stats.dailyProgress.length}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="进度" style={{ marginTop: 16 }}>
        <Progress
          percent={progressPercent}
          status={progressPercent >= 100 ? 'success' : 'active'}
          format={(percent) => `${percent}%`}
        />
        <p style={{ textAlign: 'center', marginTop: 8, color: '#666' }}>
          {stats.totalWordCount.toLocaleString()} / {stats.targetWordCount.toLocaleString()} 字
        </p>
      </Card>
    </div>
  )
}

export default Stats

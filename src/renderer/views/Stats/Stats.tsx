import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Statistic, Row, Col, Progress, message, InputNumber, Button, Space, Modal, Input } from 'antd'
import { ReadOutlined, EditOutlined, ClockCircleOutlined, TrophyOutlined, PlayCircleOutlined, PauseCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { Line, Column } from '@ant-design/charts'
import { goalApi, pomodoroApi, type WritingGoal, type PomodoroStats, type WritingSpeed } from '../../api'

interface StatsData {
  totalWordCount: number
  chapterWordCounts: Record<string, number>
  dailyProgress: { date: string; wordCount: number }[]
  targetWordCount: number
}

function Stats(): JSX.Element {
  const { projectId } = useParams()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [goal, setGoal] = useState<WritingGoal | null>(null)
  const [pomodoroStats, setPomodoroStats] = useState<PomodoroStats[]>([])
  const [speedData, setSpeedData] = useState<WritingSpeed[]>([])
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false)
  const [targetWords, setTargetWords] = useState(2000)
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroInterval, setPomodoroInterval] = useState<NodeJS.Timeout | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null)
  const [wordsAtStart, setWordsAtStart] = useState(0)
  const pomodoroRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (projectId) {
      loadStats()
      loadGoal()
      loadPomodoroStats()
      loadSpeedData()
    }
    return () => {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current)
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

  const loadGoal = async (): Promise<void> => {
    if (!projectId) return
    const today = new Date().toISOString().split('T')[0]
    try {
      const data = await goalApi.get(projectId, today)
      setGoal(data)
      if (data?.targetWords) setTargetWords(data.targetWords)
    } catch (error) {
      console.error('加载目标失败', error)
    }
  }

  const loadPomodoroStats = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await pomodoroApi.stats(projectId, 7)
      setPomodoroStats(data)
    } catch (error) {
      console.error('加载番茄钟统计失败', error)
    }
  }

  const loadSpeedData = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await pomodoroApi.speed(projectId, 7)
      setSpeedData(data)
    } catch (error) {
      console.error('加载写作速度失败', error)
    }
  }

  const saveGoal = async (): Promise<void> => {
    if (!projectId) return
    const today = new Date().toISOString().split('T')[0]
    try {
      await goalApi.set(projectId, today, targetWords)
      message.success('目标已设置')
      loadGoal()
      setIsGoalModalVisible(false)
    } catch (error) {
      message.error('设置目标失败')
    }
  }

  const startPomodoro = (): void => {
    if (pomodoroActive) {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current)
      setPomodoroActive(false)
      return
    }
    setPomodoroActive(true)
    setSessionStartTime(new Date().toISOString())
    setWordsAtStart(stats?.totalWordCount || 0)
    pomodoroRef.current = setInterval(() => {
      setPomodoroTime((prev) => {
        if (prev <= 1) {
          completePomodoro()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const completePomodoro = async (): Promise<void> => {
    if (pomodoroRef.current) clearInterval(pomodoroRef.current)
    setPomodoroActive(false)
    if (!projectId || !sessionStartTime) return
    
    const endTime = new Date().toISOString()
    const wordsWritten = (stats?.totalWordCount || 0) - wordsAtStart
    
    try {
      await pomodoroApi.add(projectId, sessionStartTime, endTime, wordsWritten)
      message.success('番茄钟完成！')
      loadPomodoroStats()
      loadSpeedData()
    } catch (error) {
      console.error('保存番茄钟失败', error)
    }
    
    setPomodoroTime(25 * 60)
    setSessionStartTime(null)
  }

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progressPercent = stats ? Math.min(Math.round((stats.totalWordCount / stats.targetWordCount) * 100), 100) : 0
  const todayProgress = stats?.dailyProgress.find((p) => p.date === new Date().toISOString().split('T')[0])
  const goalProgress = goal ? Math.min(Math.round((goal.actualWords / goal.targetWords) * 100), 100) : 0

  const speedChartData = speedData.map(d => ({
    date: d.date.slice(5),
    '写作速度': Math.round(d.wordsPerMinute)
  }))

  const pomodoroChartData = pomodoroStats.map(d => ({
    date: d.date.slice(5),
    '字数': d.words,
    '番茄钟': d.sessions * 5
  }))

  const speedConfig = {
    data: speedChartData,
    xField: 'date',
    yField: '写作速度',
    smooth: true,
    color: '#1890ff'
  }

  const pomodoroConfig = {
    data: pomodoroChartData,
    xField: 'date',
    yField: '字数',
    color: '#52c41a'
  }

  if (!stats) {
    return <div style={{ padding: 24 }}>加载中...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', overflow: 'auto', height: '100%' }}>
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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="写作进度">
            <Progress
              percent={progressPercent}
              status={progressPercent >= 100 ? 'success' : 'active'}
              format={(percent) => `${percent}%`}
            />
            <p style={{ textAlign: 'center', marginTop: 8, color: '#666' }}>
              {stats.totalWordCount.toLocaleString()} / {stats.targetWordCount.toLocaleString()} 字
            </p>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ClockCircleOutlined />
                今日目标
                {goal && <span style={{ fontWeight: 'normal', fontSize: 14, color: '#666' }}>({goal.actualWords}/{goal.targetWords} 字)</span>}
              </Space>
            }
            extra={
              <Button type="link" icon={<SettingOutlined />} onClick={() => setIsGoalModalVisible(true)}>
                设置
              </Button>
            }
          >
            <Progress
              percent={goalProgress}
              status={goalProgress >= 100 ? 'success' : 'active'}
              format={(percent) => `${percent}%`}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button 
                type={pomodoroActive ? 'default' : 'primary'} 
                icon={pomodoroActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={startPomodoro}
                size="large"
              >
                {pomodoroActive ? '暂停' : '开始写作'} ({formatTime(pomodoroTime)})
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="写作速度趋势（字/分钟）">
            {speedChartData.length > 0 ? <Line {...speedConfig} height={250} /> : <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>暂无数据</div>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="每日写作量">
            {pomodoroChartData.length > 0 ? <Column {...pomodoroConfig} height={250} /> : <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>暂无数据</div>}
          </Card>
        </Col>
      </Row>

      <Modal
        title="设置今日目标"
        open={isGoalModalVisible}
        onCancel={() => setIsGoalModalVisible(false)}
        onOk={saveGoal}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>今日目标字数：</label>
            <InputNumber
              value={targetWords}
              onChange={(value) => setTargetWords(value || 2000)}
              min={0}
              max={100000}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default Stats

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Space, message, Table, Tag as AntTag, Empty, Modal, Row, Col, Statistic, Spin, Divider, Progress, Dropdown } from 'antd'
import { RollbackOutlined, SyncOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, MoreOutlined } from '@ant-design/icons'
import { publishApi, type PublishedChapter, type ComparisonResult, type PlatformFormat } from '../../api/publishApi'

function PublishPage(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [publishedChapters, setPublishedChapters] = useState<PublishedChapter[]>([])
  const [platformFormats, setPlatformFormats] = useState<PlatformFormat[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<PublishedChapter | null>(null)
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [compareModalVisible, setCompareModalVisible] = useState(false)
    const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadPublishedChapters()
      loadPlatformFormats()
    }
  }, [projectId])

  const loadPublishedChapters = async (): Promise<void> => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await publishApi.getPublishedChapters(projectId)
      setPublishedChapters(data || [])
    } catch {
      message.error('加载发布版本失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPlatformFormats = async (): Promise<void> => {
    try {
      const data = await publishApi.getPlatformFormats()
      setPlatformFormats(data || [])
    } catch {
      console.error('Failed to load platform formats')
    }
  }

  const handleCompare = async (chapter: PublishedChapter): Promise<void> => {
    try {
      const result = await publishApi.compareWithDraft(chapter.id)
      setComparisonResult(result)
      setSelectedChapter(chapter)
      setCompareModalVisible(true)
    } catch {
      message.error('对比失败')
    }
  }

  const handleDownload = async (platform: string): Promise<void> => {
    if (!selectedChapter) return
    setDownloading(true)
    try {
      const result = await publishApi.downloadAs(selectedChapter.id, platform)
      const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('下载成功')
    } catch {
      message.error('下载失败')
    } finally {
      setDownloading(false)
    }
  }

  const getPlatformMenuItems = (): { key: string; label: string }[] => {
    return platformFormats.map(p => ({
      key: p.platform,
      label: p.platform
    }))
  }

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', render: (t: string) => <><FileTextOutlined style={{ marginRight: 8 }} />{t}</> },
    { title: '平台格式', dataIndex: 'platformFormat', key: 'platform', render: (p: string) => <AntTag color="blue">{p}</AntTag> },
    { title: '相似度', dataIndex: 'similarity', key: 'similarity', render: (s: number) => (
      <Progress 
        percent={Math.round(s * 100)} 
        size="small" 
        status={s > 0.8 ? 'success' : s > 0.5 ? 'normal' : 'exception'}
        style={{ width: 100 }}
      />
    )},
    { title: '创建时间', dataIndex: 'createdAt', key: 'created', render: (d: string) => new Date(d).toLocaleString() },
    { title: '操作', key: 'action', render: (_: any, r: PublishedChapter) => (
      <Space>
        <Button size="small" type="link" onClick={() => { setSelectedChapter(r); setCompareModalVisible(true); handleCompare(r) }}>对比</Button>
        <Dropdown 
          menu={{ 
            items: getPlatformMenuItems(),
            onClick: ({ key }) => { setSelectedChapter(r); handleDownload(key) }
          }}
          trigger={['click']}
        >
          <Button size="small" type="link">
            下载 <MoreOutlined />
          </Button>
        </Dropdown>
      </Space>
    )}
  ]

  const summaryStats = {
    total: publishedChapters.length,
    avgSimilarity: publishedChapters.length > 0 
      ? publishedChapters.reduce((sum, c) => sum + c.similarity, 0) / publishedChapters.length 
      : 0,
    highQuality: publishedChapters.filter(c => c.similarity >= 0.8).length,
    needsReview: publishedChapters.filter(c => c.similarity < 0.6).length
  }

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}><FileTextOutlined /> 发布管理</h2>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <Button icon={<SyncOutlined />} onClick={loadPublishedChapters}>刷新</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总发布数" value={summaryStats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="平均相似度" 
              value={Math.round(summaryStats.avgSimilarity * 100)} 
              suffix="%" 
              valueStyle={{ color: summaryStats.avgSimilarity > 0.7 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="高质量" 
              value={summaryStats.highQuality} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="需审核" 
              value={summaryStats.needsReview} 
              valueStyle={{ color: summaryStats.needsReview > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ flex: 1 }} bodyStyle={{ height: '100%', overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div>
        ) : publishedChapters.length > 0 ? (
          <Table 
            dataSource={publishedChapters} 
            columns={columns} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '8px 0' }}>
                  <Divider orientation="left">重写设置</Divider>
                  <Row gutter={16}>
                    <Col span={8}>
                      <span>风格: <AntTag>{record.rewriteSettings.style}</AntTag></span>
                    </Col>
                    <Col span={8}>
                      <span>语气: <AntTag>{record.rewriteSettings.tone}</AntTag></span>
                    </Col>
                    <Col span={8}>
                      <span>去冗余: {record.rewriteSettings.removeRedundancy ? '是' : '否'}</span>
                    </Col>
                  </Row>
                </div>
              )
            }}
          />
        ) : (
          <Empty description="暂无发布版本，请先在草稿管理中生成" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Modal
        title={`对比分析 - ${selectedChapter?.title || ''}`}
        open={compareModalVisible}
        onCancel={() => { setCompareModalVisible(false); setComparisonResult(null) }}
        width={800}
        footer={[
          <Button key="close" onClick={() => { setCompareModalVisible(false); setComparisonResult(null) }}>
            关闭
          </Button>
        ]}
      >
        {comparisonResult ? (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic 
                    title="整体相似度" 
                    value={Math.round(comparisonResult.similarity * 100)} 
                    suffix="%"
                    valueStyle={{ color: comparisonResult.similarity > 0.7 ? '#52c41a' : '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic 
                    title="字数变化" 
                    value={comparisonResult.wordCountDiff} 
                    suffix="字"
                    valueStyle={{ color: comparisonResult.wordCountDiff > 0 ? '#52c41a' : comparisonResult.wordCountDiff < 0 ? '#ff4d4f' : '#888' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic 
                    title="建议数" 
                    value={comparisonResult.suggestions?.length || 0} 
                  />
                </Card>
              </Col>
            </Row>

            <Divider>结构变化</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="铺垫" extra={`${comparisonResult.structureChanges.setup.before} → ${comparisonResult.structureChanges.setup.after}`}>
                  <Progress percent={comparisonResult.structureChanges.setup.after > 0 ? Math.round((comparisonResult.structureChanges.setup.after / (comparisonResult.structureChanges.setup.before || 1)) * 100) : 0} status="active" />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="发展" extra={`${comparisonResult.structureChanges.development.before} → ${comparisonResult.structureChanges.development.after}`}>
                  <Progress percent={comparisonResult.structureChanges.development.after > 0 ? Math.round((comparisonResult.structureChanges.development.after / (comparisonResult.structureChanges.development.before || 1)) * 100) : 0} status="active" />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="转折" extra={`${comparisonResult.structureChanges.twist.before} → ${comparisonResult.structureChanges.twist.after}`}>
                  <Progress percent={comparisonResult.structureChanges.twist.after > 0 ? Math.round((comparisonResult.structureChanges.twist.after / (comparisonResult.structureChanges.twist.before || 1)) * 100) : 0} status="active" />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="结尾" extra={`${comparisonResult.structureChanges.conclusion.before} → ${comparisonResult.structureChanges.conclusion.after}`}>
                  <Progress percent={comparisonResult.structureChanges.conclusion.after > 0 ? Math.round((comparisonResult.structureChanges.conclusion.after / (comparisonResult.structureChanges.conclusion.before || 1)) * 100) : 0} status="active" />
                </Card>
              </Col>
            </Row>

            {comparisonResult.techniqueScore && (
              <>
                <Divider>技巧提升</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic 
                        title="钩子提升" 
                        value={Math.round(comparisonResult.techniqueScore.hookImprovement * 100)} 
                        suffix="%"
                        valueStyle={{ color: comparisonResult.techniqueScore.hookImprovement > 0 ? '#52c41a' : '#888' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic 
                        title="伏笔提升" 
                        value={Math.round(comparisonResult.techniqueScore.foreshadowImprovement * 100)} 
                        suffix="%"
                        valueStyle={{ color: comparisonResult.techniqueScore.foreshadowImprovement > 0 ? '#52c41a' : '#888' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {comparisonResult.suggestions && comparisonResult.suggestions.length > 0 && (
              <>
                <Divider>改进建议</Divider>
                {comparisonResult.suggestions.map((s, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                    <AntTag color="blue">{s.type}</AntTag> {s.text}
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
        )}
      </Modal>
    </div>
  )
}

export default PublishPage

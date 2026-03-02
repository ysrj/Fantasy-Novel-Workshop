import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tabs, Input, Button, Space, List, message, Modal, Form, Select, Slider, Table, Tag as AntTag, Row, Col, Empty, Popconfirm, Drawer, Tree } from 'antd'
import { PlusOutlined, SaveOutlined, RollbackOutlined, UndoOutlined, DeleteOutlined, EditOutlined, ApiOutlined, ExperimentOutlined, ToolOutlined, BranchesOutlined, StarOutlined } from '@ant-design/icons'
import * as G6 from '@antv/g6'
import { useProjectStore } from '../../stores/projectStore'
import type { Realm, Stage, Breakthrough, Technique, Pill, Artifact, CultivationData } from '../../shared/types'

function WorldEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const [cultivationData, setCultivationData] = useState<CultivationData>({
    realms: [],
    stages: [],
    breakthroughs: [],
    techniques: [],
    pills: [],
    artifacts: []
  })
  const [activeTab, setActiveTab] = useState('realms')
  const [hasChanges, setHasChanges] = useState(false)
  const [initialData, setInitialData] = useState<CultivationData | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<string>('')
  const [form] = Form.useForm()
  const graphRef = useRef<HTMLDivElement>(null)
  const graphInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (projectId) {
      loadWorld()
    }
    return () => {
      if (graphInstanceRef.current) {
        graphInstanceRef.current.destroy()
      }
    }
  }, [projectId])

  useEffect(() => {
    if (activeTab === 'realmMap' && graphRef.current && cultivationData.realms.length > 0) {
      initRealmGraph()
    }
  }, [activeTab, cultivationData.realms])

  const loadWorld = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<any>('world:load', projectId)
      const cultivation = data?.cultivation || { realms: [], techniques: [], skills: [] }
      const artifacts = data?.artifacts || []
      setCultivationData({
        realms: cultivation.realms || [],
        stages: cultivation.stages || [],
        breakthroughs: cultivation.breakthroughs || [],
        techniques: cultivation.techniques || [],
        pills: cultivation.pills || [],
        artifacts: artifacts.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: 'spiritual',
          grade: 'medium' as const,
          power: a.power || '',
          abilities: [],
          description: a.description || ''
        }))
      })
      setInitialData(JSON.parse(JSON.stringify({
        realms: cultivation.realms || [],
        stages: cultivation.stages || [],
        breakthroughs: cultivation.breakthroughs || [],
        techniques: cultivation.techniques || [],
        pills: cultivation.pills || [],
        artifacts: artifacts
      })))
    } catch (error) {
      message.error('加载世界观失败')
    }
  }

  const saveWorld = async (): Promise<void> => {
    if (!projectId || !cultivationData) return
    try {
      const worldData = {
        cultivation: {
          realms: cultivationData.realms,
          stages: cultivationData.stages,
          breakthroughs: cultivationData.breakthroughs,
          techniques: cultivationData.techniques,
          skills: []
        },
        pills: cultivationData.pills,
        artifacts: cultivationData.artifacts,
        geography: { locations: [] },
        history: [],
        factions: []
      }
      await window.api.invoke('world:save', projectId, worldData)
      setInitialData(JSON.parse(JSON.stringify(cultivationData)))
      setHasChanges(false)
      message.success('世界观已保存')
    } catch (error) {
      message.error('保存世界观失败')
    }
  }

  const handleReset = (): void => {
    if (initialData) {
      setCultivationData(JSON.parse(JSON.stringify(initialData)))
      setHasChanges(false)
      message.info('已重置')
    }
  }

  const handleCancel = (): void => {
    if (initialData) {
      setCultivationData(JSON.parse(JSON.stringify(initialData)))
      setHasChanges(false)
      message.info('已取消更改')
    }
  }

  const handleBack = (): void => {
    if (hasChanges) {
      message.warning('您有未保存的更改')
    } else {
      navigate(-1)
    }
  }

  const updateData = (type: string, data: any[]): void => {
    setCultivationData({
      ...cultivationData,
      [type]: data
    })
    setHasChanges(true)
  }

  const openModal = (type: string, item?: any): void => {
    setModalType(type)
    setEditingItem(item)
    setModalVisible(true)
    if (item) {
      form.setFieldsValue(item)
    } else {
      form.resetFields()
    }
  }

  const handleModalOk = async (): Promise<void> => {
    const values = await form.validateFields()
    const id = editingItem?.id || `${modalType}_${Date.now()}`
    const newItem = { ...values, id }
    
    let newData: any[] = []
    switch (modalType) {
      case 'realm':
        newData = editingItem 
          ? cultivationData.realms.map(r => r.id === id ? newItem : r)
          : [...cultivationData.realms, { ...newItem, order: cultivationData.realms.length + 1 }]
        updateData('realms', newData)
        break
      case 'stage':
        newData = editingItem
          ? cultivationData.stages.map(s => s.id === id ? newItem : s)
          : [...cultivationData.stages, newItem]
        updateData('stages', newData)
        break
      case 'breakthrough':
        newData = editingItem
          ? cultivationData.breakthroughs.map(b => b.id === id ? newItem : b)
          : [...cultivationData.breakthroughs, newItem]
        updateData('breakthroughs', newData)
        break
      case 'technique':
        newData = editingItem
          ? cultivationData.techniques.map(t => t.id === id ? newItem : t)
          : [...cultivationData.techniques, newItem]
        updateData('techniques', newData)
        break
      case 'pill':
        newData = editingItem
          ? cultivationData.pills.map(p => p.id === id ? newItem : p)
          : [...cultivationData.pills, newItem]
        updateData('pills', newData)
        break
      case 'artifact':
        newData = editingItem
          ? cultivationData.artifacts.map(a => a.id === id ? newItem : a)
          : [...cultivationData.artifacts, newItem]
        updateData('artifacts', newData)
        break
    }
    setModalVisible(false)
  }

  const deleteItem = (type: string, id: string): void => {
    const key = type === 'breakthrough' ? 'breakthroughs' : type === 'artifact' ? 'artifacts' : `${type}s`
    const dataKey = type === 'realm' ? 'realms' : type === 'stage' ? 'stages' : type === 'breakthrough' ? 'breakthroughs' : type === 'technique' ? 'techniques' : type === 'pill' ? 'pills' : 'artifacts'
    const newData = cultivationData[dataKey as keyof CultivationData].filter((item: any) => item.id !== id)
    updateData(dataKey, newData)
  }

  const initRealmGraph = (): void => {
    if (!graphRef.current) return
    if (graphInstanceRef.current) {
      graphInstanceRef.current.destroy()
    }

    const nodes = cultivationData.realms.map((realm, idx) => ({
      id: realm.id,
      label: realm.name,
      description: realm.description,
      style: {
        fill: realm.color || '#1890ff',
        stroke: '#666',
        lineWidth: 2
      },
      x: 200 + idx * 180,
      y: 200
    }))

    const edges = cultivationData.breakthroughs.map((bt, idx) => ({
      id: `edge-${idx}`,
      source: bt.fromRealmId,
      target: bt.toRealmId,
      label: '突破',
      style: {
        endArrow: true,
        stroke: '#52c41a',
        lineWidth: 2
      }
    }))

    try {
      const G6Any = G6 as any
      const graph = new G6Any.Graph({
        container: graphRef.current,
        width: graphRef.current.offsetWidth || 800,
        height: 400,
        fitView: true,
        defaultNode: {
          type: 'circle',
          size: 60
        },
        defaultEdge: {
          type: 'cubic-horizontal'
        },
        modes: {
          default: ['drag-canvas', 'zoom-canvas', 'drag-node']
        }
      })

      graph.data({ nodes, edges })
      graph.render()
      graph.fitView()
      graphInstanceRef.current = graph
    } catch (e) {
      console.error('Graph init error:', e)
    }
  }

  const realmColumns = [
    { title: '境界', dataIndex: 'name', key: 'name', render: (text: string, record: Realm) => <Space><AntTag color={record.color}>{text}</AntTag></Space> },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '层级数', key: 'stageCount', render: (_: any, record: Realm) => cultivationData.stages.filter(s => s.realmId === record.id).length },
    { title: '操作', key: 'action', render: (_: any, record: Realm) => (
      <Space>
        <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openModal('realm', record)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => deleteItem('realm', record.id)}>
          <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )}
  ]

  const techniqueColumns = [
    { title: '功法名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => <AntTag color={type === 'attack' ? 'red' : type === 'defense' ? 'blue' : type === 'healing' ? 'green' : 'orange'}>{type}</AntTag> },
    { title: '适用境界', dataIndex: 'realm', key: 'realm' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '操作', key: 'action', render: (_: any, record: Technique) => (
      <Space>
        <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openModal('technique', record)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => deleteItem('technique', record.id)}>
          <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )}
  ]

  const pillColumns = [
    { title: '丹药名称', dataIndex: 'name', key: 'name' },
    { title: '等级', dataIndex: 'grade', key: 'grade', render: (grade: string) => <AntTag color={grade === 'low' ? 'default' : grade === 'medium' ? 'blue' : grade === 'high' ? 'purple' : 'gold'}>{grade}</AntTag> },
    { title: '功效', dataIndex: 'effects', key: 'effects', ellipsis: true },
    { title: '成功率', dataIndex: 'successRate', key: 'successRate', render: (rate: number) => `${rate}%` },
    { title: '操作', key: 'action', render: (_: any, record: Pill) => (
      <Space>
        <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openModal('pill', record)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => deleteItem('pill', record.id)}>
          <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )}
  ]

  const artifactColumns = [
    { title: '法宝名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => <AntTag>{type}</AntTag> },
    { title: '等级', dataIndex: 'grade', key: 'grade', render: (grade: string) => <AntTag color={grade === 'legendary' ? 'gold' : grade === 'super' ? 'purple' : 'blue'}>{grade}</AntTag> },
    { title: '威力', dataIndex: 'power', key: 'power', ellipsis: true },
    { title: '操作', key: 'action', render: (_: any, record: Artifact) => (
      <Space>
        <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openModal('artifact', record)}>编辑</Button>
        <Popconfirm title="确认删除?" onConfirm={() => deleteItem('artifact', record.id)}>
          <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )}
  ]

  const renderModalForm = () => {
    switch (modalType) {
      case 'realm':
        return (
          <>
            <Form.Item name="name" label="境界名称" rules={[{ required: true }]}>
              <Input placeholder="如：练气、筑基、金丹" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={2} placeholder="境界描述" />
            </Form.Item>
            <Form.Item name="color" label="颜色">
              <Input type="color" />
            </Form.Item>
          </>
        )
      case 'technique':
        return (
          <>
            <Form.Item name="name" label="功法名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="type" label="类型">
              <Select options={[
                { value: 'attack', label: '攻击' },
                { value: 'defense', label: '防御' },
                { value: 'healing', label: '治疗' },
                { value: 'support', label: '辅助' },
                { value: 'cultivation', label: '修炼' }
              ]} />
            </Form.Item>
            <Form.Item name="realm" label="适用境界">
              <Input placeholder="如：练气、筑基" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="effects" label="效果">
              <Input.TextArea rows={2} placeholder="功法效果描述" />
            </Form.Item>
            <Form.Item name="requirements" label="修炼要求">
              <Input.TextArea rows={2} placeholder="修炼此功法的要求" />
            </Form.Item>
          </>
        )
      case 'pill':
        return (
          <>
            <Form.Item name="name" label="丹药名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="grade" label="等级">
              <Select options={[
                { value: 'low', label: '下品' },
                { value: 'medium', label: '中品' },
                { value: 'high', label: '上品' },
                { value: 'super', label: '极品' }
              ]} />
            </Form.Item>
            <Form.Item name="effects" label="功效">
              <Input.TextArea rows={2} placeholder="丹药功效" />
            </Form.Item>
            <Form.Item name="ingredients" label="配方">
              <Input.TextArea rows={2} placeholder="药材1: 数量, 药材2: 数量" />
            </Form.Item>
            <Form.Item name="sideEffects" label="副作用">
              <Input.TextArea rows={2} placeholder="副作用描述" />
            </Form.Item>
            <Form.Item name="successRate" label="成丹率">
              <Slider min={0} max={100} />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={2} />
            </Form.Item>
          </>
        )
      case 'artifact':
        return (
          <>
            <Form.Item name="name" label="法宝名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="type" label="类型">
              <Select options={[
                { value: 'weapon', label: '武器' },
                { value: 'armor', label: '防具' },
                { value: 'accessory', label: '饰品' },
                { value: 'spiritual', label: '灵器' }
              ]} />
            </Form.Item>
            <Form.Item name="grade" label="等级">
              <Select options={[
                { value: 'low', label: '下品' },
                { value: 'medium', label: '中品' },
                { value: 'high', label: '上品' },
                { value: 'super', label: '极品' },
                { value: 'legendary', label: '神器' }
              ]} />
            </Form.Item>
            <Form.Item name="owner" label="拥有者">
              <Input placeholder="法宝拥有者" />
            </Form.Item>
            <Form.Item name="power" label="威力">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="abilities" label="特殊能力">
              <Input.TextArea rows={2} placeholder="法宝特殊能力" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={2} />
            </Form.Item>
          </>
        )
      default:
        return null
    }
  }

  const tabItems = [
    {
      key: 'realms',
      label: <span><ApiOutlined /> 境界体系</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>管理修炼境界（练气、筑基、金丹、元婴...）</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('realm')}>添加境界</Button>
          </div>
          <Table dataSource={cultivationData.realms} columns={realmColumns} rowKey="id" pagination={false} />
        </div>
      )
    },
    {
      key: 'realmMap',
      label: <span><BranchesOutlined /> 境界路线图</span>,
      children: (
        <div>
          <p style={{ marginBottom: 16, color: '#666' }}>境界突破路线图 - 拖拽节点可调整位置</p>
          <div ref={graphRef} style={{ background: '#fff', borderRadius: 8, minHeight: 400 }} />
          {cultivationData.realms.length === 0 && <Empty description="请先添加境界" />}
        </div>
      )
    },
    {
      key: 'techniques',
      label: <span><StarOutlined /> 功法</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>管理功法（攻击、防御、治疗、辅助、修炼）</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('technique')}>添加功法</Button>
          </div>
          <Table dataSource={cultivationData.techniques} columns={techniqueColumns} rowKey="id" pagination={{ pageSize: 10 }} />
        </div>
      )
    },
    {
      key: 'pills',
      label: <span><ExperimentOutlined /> 丹药</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>管理丹药配方和功效</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('pill')}>添加丹药</Button>
          </div>
          <Table dataSource={cultivationData.pills} columns={pillColumns} rowKey="id" pagination={{ pageSize: 10 }} />
        </div>
      )
    },
    {
      key: 'artifacts',
      label: <span><ToolOutlined /> 法宝</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>管理法宝（武器、防具、饰品、灵器）</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('artifact')}>添加法宝</Button>
          </div>
          <Table dataSource={cultivationData.artifacts} columns={artifactColumns} rowKey="id" pagination={{ pageSize: 10 }} />
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>修炼体系管理</h2>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBack}>返回</Button>
          {hasChanges && <Button onClick={handleCancel}>取消</Button>}
          <Button icon={<UndoOutlined />} onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveWorld} disabled={!hasChanges}>保存</Button>
        </Space>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      <Modal
        title={editingItem ? `编辑${modalType === 'realm' ? '境界' : modalType === 'technique' ? '功法' : modalType === 'pill' ? '丹药' : '法宝'}` : `添加${modalType === 'realm' ? '境界' : modalType === 'technique' ? '功法' : modalType === 'pill' ? '丹药' : '法宝'}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
        width={600}
      >
        <Form form={form} layout="vertical">
          {renderModalForm()}
        </Form>
      </Modal>
    </div>
  )
}

export default WorldEditor

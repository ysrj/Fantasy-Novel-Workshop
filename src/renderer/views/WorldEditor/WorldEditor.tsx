import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Input, Button, Space, message, Modal, Form, Select, Slider, Table, Tag as AntTag, Row, Col, Empty, Popconfirm, InputNumber, Timeline, Card, Alert, Badge, Checkbox } from 'antd'
import { PlusOutlined, SaveOutlined, RollbackOutlined, UndoOutlined, DeleteOutlined, EditOutlined, ApiOutlined, ExperimentOutlined, ToolOutlined, StarOutlined, GlobalOutlined, HomeOutlined, AimOutlined, HeatMapOutlined, NodeIndexOutlined, ClockCircleOutlined, HistoryOutlined, UserOutlined, WarningOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import * as G6 from '@antv/g6'
import { useProjectStore } from '../../stores/projectStore'
import type { Realm, Technique, Pill, Artifact, CultivationData, Region, Sect, Location, Rift, PlotPoint, GeographyData, Era, HistoricalEvent, CharacterAge, TimeSkip, CultivationPeriod, TimeData } from '../../shared/types'

function WorldEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [cultivationData, setCultivationData] = useState<CultivationData>({
    realms: [], stages: [], breakthroughs: [], techniques: [], pills: [], artifacts: []
  })
  const [geographyData, setGeographyData] = useState<GeographyData>({
    regions: [], sects: [], territories: [], importantLocations: [], spatialRifts: [], plotPoints: []
  })
  const [timeData, setTimeData] = useState<TimeData>({
    eras: [], events: [], characterAges: [], timeSkips: [], cultivationPeriods: []
  })
  
  const [activeTab, setActiveTab] = useState('eras')
  const [hasChanges, setHasChanges] = useState(false)
  const [initialData, setInitialData] = useState<{ cultivation: CultivationData; geography: GeographyData; time: TimeData } | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<string>('')
  const [form] = Form.useForm()
  
  const mapRef = useRef<HTMLDivElement>(null)
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
    if (activeTab === 'mapView' && mapRef.current && geographyData.regions.length > 0) {
      initMapGraph()
    }
  }, [activeTab, geographyData])

  const loadWorld = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<any>('world:load', projectId)
      const cultivation = data?.cultivation || { realms: [], techniques: [], stages: [], breakthroughs: [] }
      const geography = data?.geography || { regions: [], sects: [], importantLocations: [], spatialRifts: [], plotPoints: [], territories: [] }
      const time = data?.time || { eras: [], events: [], characterAges: [], timeSkips: [], cultivationPeriods: [] }
      
      setCultivationData({
        realms: cultivation.realms || [],
        stages: cultivation.stages || [],
        breakthroughs: cultivation.breakthroughs || [],
        techniques: cultivation.techniques || [],
        pills: cultivation.pills || [],
        artifacts: data?.artifacts || []
      })
      
      setGeographyData({
        regions: geography.regions || [],
        sects: geography.sects || [],
        territories: geography.territories || [],
        importantLocations: geography.importantLocations || [],
        spatialRifts: geography.spatialRifts || [],
        plotPoints: geography.plotPoints || []
      })
      
      setTimeData({
        eras: time.eras || [],
        events: time.events || [],
        characterAges: time.characterAges || [],
        timeSkips: time.timeSkips || [],
        cultivationPeriods: time.cultivationPeriods || []
      })
      
      setInitialData(JSON.parse(JSON.stringify({ cultivation: { realms: cultivation.realms || [], stages: cultivation.stages || [], breakthroughs: cultivation.breakthroughs || [], techniques: cultivation.techniques || [], pills: cultivation.pills || [], artifacts: data?.artifacts || [] }, geography, time })))
    } catch (error) {
      message.error('加载世界观失败')
    }
  }

  const saveWorld = async (): Promise<void> => {
    if (!projectId) return
    try {
      const worldData = {
        cultivation: {
          realms: cultivationData.realms,
          stages: cultivationData.stages,
          breakthroughs: cultivationData.breakthroughs,
          techniques: cultivationData.techniques,
          skills: []
        },
        geography: {
          regions: geographyData.regions,
          sects: geographyData.sects,
          territories: geographyData.territories,
          importantLocations: geographyData.importantLocations,
          spatialRifts: geographyData.spatialRifts,
          plotPoints: geographyData.plotPoints
        },
        time: timeData,
        pills: cultivationData.pills,
        artifacts: cultivationData.artifacts,
        history: [],
        factions: []
      }
      await window.api.invoke('world:save', projectId, worldData)
      setHasChanges(false)
      message.success('世界观已保存')
    } catch (error) {
      message.error('保存世界观失败')
    }
  }

  const handleReset = (): void => {
    if (initialData) {
      setCultivationData(initialData.cultivation)
      setGeographyData(initialData.geography)
      setTimeData(initialData.time)
      setHasChanges(false)
      message.info('已重置')
    }
  }

  const handleCancel = (): void => {
    if (initialData) {
      setCultivationData(initialData.cultivation)
      setGeographyData(initialData.geography)
      setTimeData(initialData.time)
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

  const updateData = (section: 'cultivation' | 'geography' | 'time', type: string, data: any[]): void => {
    if (section === 'cultivation') {
      setCultivationData({ ...cultivationData, [type]: data })
    } else if (section === 'geography') {
      setGeographyData({ ...geographyData, [type]: data })
    } else {
      setTimeData({ ...timeData, [type]: data })
    }
    setHasChanges(true)
  }

  const openModal = (section: 'cultivation' | 'geography' | 'time', type: string, item?: any): void => {
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
    
    let targetData: any[]
    switch (modalType) {
      case 'realm':
        targetData = editingItem ? cultivationData.realms.map(r => r.id === id ? newItem : r) : [...cultivationData.realms, { ...newItem, order: cultivationData.realms.length + 1 }]
        updateData('cultivation', 'realms', targetData)
        break
      case 'technique':
        targetData = editingItem ? cultivationData.techniques.map(t => t.id === id ? newItem : t) : [...cultivationData.techniques, newItem]
        updateData('cultivation', 'techniques', targetData)
        break
      case 'pill':
        targetData = editingItem ? cultivationData.pills.map(p => p.id === id ? newItem : p) : [...cultivationData.pills, newItem]
        updateData('cultivation', 'pills', targetData)
        break
      case 'artifact':
        targetData = editingItem ? cultivationData.artifacts.map(a => a.id === id ? newItem : a) : [...cultivationData.artifacts, newItem]
        updateData('cultivation', 'artifacts', targetData)
        break
      case 'region':
        targetData = editingItem ? geographyData.regions.map(r => r.id === id ? newItem : r) : [...geographyData.regions, newItem]
        updateData('geography', 'regions', targetData)
        break
      case 'sect':
        targetData = editingItem ? geographyData.sects.map(s => s.id === id ? newItem : s) : [...geographyData.sects, newItem]
        updateData('geography', 'sects', targetData)
        break
      case 'location':
        targetData = editingItem ? geographyData.importantLocations.map(l => l.id === id ? newItem : l) : [...geographyData.importantLocations, newItem]
        updateData('geography', 'importantLocations', targetData)
        break
      case 'rift':
        targetData = editingItem ? geographyData.spatialRifts.map(r => r.id === id ? newItem : r) : [...geographyData.spatialRifts, newItem]
        updateData('geography', 'spatialRifts', targetData)
        break
      case 'plotPoint':
        targetData = editingItem ? geographyData.plotPoints.map(p => p.id === id ? newItem : p) : [...geographyData.plotPoints, newItem]
        updateData('geography', 'plotPoints', targetData)
        break
      case 'era':
        targetData = editingItem ? timeData.eras.map(e => e.id === id ? newItem : e) : [...timeData.eras, newItem]
        updateData('time', 'eras', targetData)
        break
      case 'event':
        targetData = editingItem ? timeData.events.map(e => e.id === id ? newItem : e) : [...timeData.events, newItem]
        updateData('time', 'events', targetData)
        break
      case 'characterAge':
        targetData = editingItem ? timeData.characterAges.map(c => c.characterId === id ? newItem : c) : [...timeData.characterAges, newItem]
        updateData('time', 'characterAges', targetData)
        break
      case 'timeSkip':
        targetData = editingItem ? timeData.timeSkips.map(t => t.id === id ? newItem : t) : [...timeData.timeSkips, newItem]
        updateData('time', 'timeSkips', targetData)
        break
    }
    setModalVisible(false)
  }

  const deleteItem = (section: 'cultivation' | 'geography' | 'time', type: string, id: string): void => {
    const keyMap: Record<string, string> = {
      'realm': 'realms', 'technique': 'techniques', 'pill': 'pills', 'artifact': 'artifacts',
      'region': 'regions', 'sect': 'sects', 'location': 'importantLocations', 'rift': 'spatialRifts', 'plotPoint': 'plotPoints',
      'era': 'eras', 'event': 'events', 'characterAge': 'characterAges', 'timeSkip': 'timeSkips'
    }
    const key = keyMap[type] || type
    if (section === 'cultivation') {
      setCultivationData({ ...cultivationData, [key]: cultivationData[key as keyof CultivationData as any].filter((item: any) => item.id !== id) })
    } else if (section === 'geography') {
      setGeographyData({ ...geographyData, [key]: geographyData[key as keyof GeographyData as any].filter((item: any) => item.id !== id) })
    } else {
      setTimeData({ ...timeData, [key]: timeData[key as keyof TimeData as any].filter((item: any) => item.id !== id) })
    }
    setHasChanges(true)
  }

  const initMapGraph = (): void => {
    if (!mapRef.current) return
    if (graphInstanceRef.current) {
      graphInstanceRef.current.destroy()
    }

    const nodes: any[] = []
    const edges: any[] = []

    geographyData.regions.forEach((region, idx) => {
      nodes.push({ id: region.id, label: region.name, type: 'circle', size: region.size || 80, style: { fill: region.color || '#1890ff', stroke: '#666', lineWidth: 2 }, x: region.coordinates?.x || (100 + idx * 150), y: region.coordinates?.y || 200 })
    })

    geographyData.importantLocations.forEach((loc) => {
      nodes.push({ id: loc.id, label: loc.name, type: 'rect', size: [60, 30], style: { fill: loc.dangerLevel > 7 ? '#ff4d4f' : loc.dangerLevel > 4 ? '#faad14' : '#52c41a', stroke: '#666' }, x: loc.coordinates?.x || (Math.random() * 600 + 50), y: loc.coordinates?.y || (Math.random() * 300 + 50) })
    })

    geographyData.spatialRifts.forEach((rift, idx) => {
      edges.push({ id: `rift-${idx}`, source: rift.fromLocation, target: rift.toLocation, label: rift.name, style: { stroke: rift.stability === 'stable' ? '#52c41a' : '#faad14', lineDash: rift.stability === 'unstable' ? [5, 5] : [], lineWidth: 2 } })
    })

    try {
      const G6Any = G6 as any
      const graph = new G6Any.Graph({ container: mapRef.current, width: mapRef.current.offsetWidth || 900, height: 500, fitView: true, modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node'] }, defaultNode: { labelCfg: { position: 'bottom', offset: 5 } }, defaultEdge: { type: 'quadratic' } })
      graph.data({ nodes, edges })
      graph.render()
      graph.fitView()
      graphInstanceRef.current = graph
    } catch (e) {
      console.error('Graph init error:', e)
    }
  }

  const renderModalForm = () => {
    switch (modalType) {
      case 'era':
        return (
          <>
            <Form.Item name="name" label="纪元名称" rules={[{ required: true }]}><Input placeholder="如：太古、上古、近古" /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="startYear" label="起始年"><InputNumber style={{ width: '100%' }} placeholder="如：-100000" /></Form.Item></Col>
              <Col span={12}><Form.Item name="endYear" label="结束年"><InputNumber style={{ width: '100%' }} placeholder="空表示至今" /></Form.Item></Col>
            </Row>
            <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="color" label="颜色"><Input type="color" /></Form.Item>
          </>
        )
      case 'event':
        return (
          <>
            <Form.Item name="title" label="事件名称" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="eraId" label="所属纪元"><Select options={timeData.eras.map(e => ({ value: e.id, label: e.name }))} /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="year" label="发生年份"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item name="location" label="发生地点"><Input /></Form.Item></Col>
            </Row>
            <Form.Item name="characters" label="涉及人物"><Input.TextArea rows={2} placeholder="人物1, 人物2" /></Form.Item>
            <Form.Item name="description" label="事件描述"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="consequences" label="后续影响"><Input.TextArea rows={2} placeholder="事件的后续影响" /></Form.Item>
          </>
        )
      case 'characterAge':
        return (
          <>
            <Form.Item name="characterId" label="角色" rules={[{ required: true }]}><Input placeholder="角色名称" /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="birthYear" label="出生年"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item name="currentYear" label="当前年"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="currentAge" label="当前年龄"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item name="cultivationAge" label="修炼年限"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
            <Form.Item name="status" label="状态"><Select options={[{ value: 'alive', label: '在世' }, { value: 'deceased', label: '已故' }, { value: 'missing', label: '失踪' }]} /></Form.Item>
          </>
        )
      case 'timeSkip':
        return (
          <>
            <Form.Item name="startChapter" label="起始章节"><Input placeholder="章节名/ID" /></Form.Item>
            <Form.Item name="endChapter" label="结束章节"><Input placeholder="章节名/ID" /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="timePassed" label="经过时间"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
              <Col span={12}><Form.Item name="unit" label="单位"><Select options={[{ value: 'day', label: '天' }, { value: 'month', label: '月' }, { value: 'year', label: '年' }, { value: 'decade', label: '十年' }, { value: 'century', label: '百年' }]} /></Form.Item></Col>
            </Row>
            <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          </>
        )
      case 'region':
        return (<><Form.Item name="name" label="区域名称"><Input placeholder="如：东洲、西漠" /></Form.Item><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item><Form.Item name="color" label="颜色"><Input type="color" /></Form.Item><Row gutter={16}><Col span={12}><Form.Item name={['coordinates', 'x']} label="X坐标"><InputNumber style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name={['coordinates', 'y']} label="Y坐标"><InputNumber style={{ width: '100%' }} /></Form.Item></Col></Row><Form.Item name="size" label="大小"><Slider min={40} max={150} /></Form.Item></>)
      case 'sect':
        return (<><Form.Item name="name" label="宗门名称"><Input /></Form.Item><Form.Item name="type" label="类型"><Select options={[{ value: 'righteous', label: '正道' }, { value: 'demon', label: '魔道' }, { value: 'neutral', label: '中立' }, { value: 'ancient', label: '古派' }]} /></Form.Item><Form.Item name="leader" label="掌门"><Input /></Form.Item><Form.Item name="location" label="所在地"><Input /></Form.Item><Form.Item name="power" label="实力等级"><Slider min={1} max={100} /></Form.Item><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item></>)
      case 'location':
        return (<><Form.Item name="name" label="地点名称"><Input placeholder="如：青云秘境" /></Form.Item><Form.Item name="type" label="类型"><Select options={[{ value: 'secret Realm', label: '秘境' }, { value: 'ruins', label: '遗迹' }, { value: 'forbidden', label: '禁地' }, { value: 'treasure', label: '宝地' }, { value: 'dangerous', label: '险地' }]} /></Form.Item><Form.Item name="region" label="所属区域"><Select options={geographyData.regions.map(r => ({ value: r.id, label: r.name }))} /></Form.Item><Form.Item name="dangerLevel" label="危险等级"><Slider min={1} max={10} marks={{ 1: '安全', 5: '危险', 10: '致命' }} /></Form.Item><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item></>)
      case 'rift':
        return (<><Form.Item name="name" label="传送阵名称"><Input /></Form.Item><Form.Item name="fromLocation" label="起点"><Select options={[...geographyData.regions.map(r => ({ value: r.id, label: r.name })), ...geographyData.importantLocations.map(l => ({ value: l.id, label: l.name }))]} /></Form.Item><Form.Item name="toLocation" label="终点"><Select options={[...geographyData.regions.map(r => ({ value: r.id, label: r.name })), ...geographyData.importantLocations.map(l => ({ value: l.id, label: l.name }))]} /></Form.Item><Form.Item name="stability" label="稳定性"><Select options={[{ value: 'stable', label: '稳定' }, { value: 'unstable', label: '不稳定' }, { value: 'dangerous', label: '危险' }]} /></Form.Item><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item></>)
      case 'plotPoint':
        return (<><Form.Item name="name" label="剧情点名称"><Input /></Form.Item><Form.Item name="sequence" label="顺序"><InputNumber min={1} max={100} style={{ width: '100%' }} /></Form.Item><Form.Item name="location" label="发生地点"><Select options={[...geographyData.regions.map(r => ({ value: r.id, label: r.name })), ...geographyData.importantLocations.map(l => ({ value: l.id, label: l.name }))]} allowClear /></Form.Item><Form.Item name="characters" label="涉及人物"><Input.TextArea rows={2} /></Form.Item><Form.Item name="description" label="剧情描述"><Input.TextArea rows={3} /></Form.Item></>)
      default:
        return null
    }
  }

  const eraColumns = [
    { title: '纪元', dataIndex: 'name', key: 'name', render: (t: string, r: Era) => <AntTag color={r.color}>{t}</AntTag> },
    { title: '时间范围', key: 'range', render: (_: any, r: Era) => `${r.startYear} ~ ${r.endYear || '至今'}` },
    { title: '事件数', key: 'events', render: (_: any, r: Era) => timeData.events.filter(e => e.eraId === r.id).length },
    { title: '操作', key: 'action', render: (_: any, r: Era) => <Space><Button size="small" type="link" icon={<EditOutlined />} onClick={() => openModal('time', 'era', r)}>编辑</Button><Popconfirm title="确认删除?" onConfirm={() => deleteItem('time', 'era', r.id)}><Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm></Space> }
  ]

  const eventColumns = [
    { title: '年份', dataIndex: 'year', key: 'year', width: 80, sorter: (a: HistoricalEvent, b: HistoricalEvent) => a.year - b.year },
    { title: '事件', dataIndex: 'title', key: 'title' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '涉及人物', dataIndex: 'characters', key: 'characters', render: (chars: string[]) => chars?.slice(0, 3).map(c => <AntTag key={c}>{c}</AntTag>) },
    { title: '操作', key: 'action', render: (_: any, e: HistoricalEvent) => <Space><Button size="small" type="link" onClick={() => openModal('time', 'event', e)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('time', 'event', e.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }
  ]

  const characterAgeColumns = [
    { title: '角色', dataIndex: 'characterId', key: 'characterId' },
    { title: '年龄', dataIndex: 'currentAge', key: 'currentAge', render: (age: number, r: CharacterAge) => `${age}岁` },
    { title: '修炼年限', dataIndex: 'cultivationAge', key: 'cultivationAge', render: (age: number) => `${age}年` },
    { title: '出生年', dataIndex: 'birthYear', key: 'birthYear' },
    { title: '当前年', dataIndex: 'currentYear', key: 'currentYear' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <AntTag color={s === 'alive' ? 'green' : s === 'deceased' ? 'red' : 'orange'}>{s === 'alive' ? '在世' : s === 'deceased' ? '已故' : '失踪'}</AntTag> },
    { title: '操作', key: 'action', render: (_: any, r: CharacterAge) => <Space><Button size="small" type="link" onClick={() => openModal('time', 'characterAge', r)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('time', 'characterAge', r.characterId)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }
  ]

  const timeSkipColumns = [
    { title: '起始章节', dataIndex: 'startChapter', key: 'startChapter' },
    { title: '结束章节', dataIndex: 'endChapter', key: 'endChapter' },
    { title: '经过时间', key: 'duration', render: (_: any, t: TimeSkip) => `${t.timePassed}${t.unit === 'day' ? '天' : t.unit === 'month' ? '月' : t.unit === 'year' ? '年' : t.unit === 'decade' ? '十年' : '百年'}` },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '操作', key: 'action', render: (_: any, t: TimeSkip) => <Space><Button size="small" type="link" onClick={() => openModal('time', 'timeSkip', t)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('time', 'timeSkip', t.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }
  ]

  const detectTimeConflicts = (): { conflicts: string[]; warnings: string[] } => {
    const conflicts: string[] = []
    const warnings: string[] = []
    
    timeData.timeSkips.forEach(skip => {
      const chapter = skip.startChapter
      const timePassed = skip.timePassed
      timeData.characterAges.forEach(char => {
        if (char.status === 'alive') {
          warnings.push(`角色 ${char.characterId} 在章节 ${chapter} 中时间跳跃 ${timePassed} ${skip.unit}`)
        }
      })
    })
    
    timeData.events.forEach(evt => {
      const year = evt.year
      timeData.characterAges.forEach(char => {
        const ageAtEvent = year - (char.birthYear || 0) + (char.currentYear - char.currentAge)
        if (ageAtEvent < 0) {
          conflicts.push(`事件"${evt.title}"发生时，角色${char.characterId}年龄为负数`)
        }
      })
    })
    
    return { conflicts, warnings }
  }

  const checkRealmAgeMatch = (): string[] => {
    const issues: string[] = []
    cultivationData.realms.forEach(realm => {
      const periods = timeData.cultivationPeriods.filter(p => p.realm === realm.name)
      periods.forEach(period => {
        if (period.duration && period.duration > 100) {
          issues.push(`角色在${realm.name}境界修炼了${period.duration}年，可能时间过长`)
        }
      })
    })
    return issues
  }

  const { conflicts, warnings } = detectTimeConflicts()
  const realmAgeIssues = checkRealmAgeMatch()

  const cultivationTabItems = [
    { key: 'realms', label: <span><ApiOutlined /> 境界</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'realm')}>添加境界</Button></div><Table dataSource={cultivationData.realms} rowKey="id" pagination={false} columns={[{ title: '境界', dataIndex: 'name', key: 'name', render: (t: string, r: Realm) => <AntTag color={r.color}>{t}</AntTag> }, { title: '描述', dataIndex: 'description', key: 'desc' }, { title: '操作', key: 'action', render: (_: any, r: Realm) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'realm', r)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'realm', r.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'techniques', label: <span><StarOutlined /> 功法</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'technique')}>添加功法</Button></div><Table dataSource={cultivationData.techniques} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '功法', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type' }, { title: '境界', dataIndex: 'realm', key: 'realm' }, { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true }, { title: '操作', key: 'action', render: (_: any, t: Technique) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'technique', t)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'technique', t.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'pills', label: <span><ExperimentOutlined /> 丹药</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'pill')}>添加丹药</Button></div><Table dataSource={cultivationData.pills} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '丹药', dataIndex: 'name', key: 'name' }, { title: '等级', dataIndex: 'grade', key: 'grade' }, { title: '功效', dataIndex: 'effects', key: 'effects', ellipsis: true }, { title: '操作', key: 'action', render: (_: any, p: Pill) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'pill', p)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'pill', p.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'artifacts', label: <span><ToolOutlined /> 法宝</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'artifact')}>添加法宝</Button></div><Table dataSource={cultivationData.artifacts} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '法宝', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type' }, { title: '等级', dataIndex: 'grade', key: 'grade', render: (g: string) => <AntTag color={g === 'legendary' ? 'gold' : 'blue'}>{g}</AntTag> }, { title: '操作', key: 'action', render: (_: any, a: Artifact) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'artifact', a)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'artifact', a.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> }
  ]

  const geographyTabItems = [
    { key: 'regions', label: <span><GlobalOutlined /> 区域</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'region')}>添加区域</Button></div><Table dataSource={geographyData.regions} rowKey="id" pagination={false} columns={[{ title: '区域', dataIndex: 'name', key: 'name', render: (t: string, r: Region) => <AntTag color={r.color}>{t}</AntTag> }, { title: '操作', key: 'action', render: (_: any, r: Region) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'region', r)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'region', r.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'sects', label: <span><HomeOutlined /> 宗门势力</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'sect')}>添加宗门</Button></div><Table dataSource={geographyData.sects} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '宗门', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <AntTag color={t === 'righteous' ? 'blue' : t === 'demon' ? 'red' : 'default'}>{t}</AntTag> }, { title: '掌门', dataIndex: 'leader', key: 'leader' }, { title: '操作', key: 'action', render: (_: any, s: Sect) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'sect', s)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'sect', s.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'locations', label: <span><AimOutlined /> 秘境禁地</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'location')}>添加地点</Button></div><Table dataSource={geographyData.importantLocations} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '地点', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type' }, { title: '危险', dataIndex: 'dangerLevel', key: 'dangerLevel', render: (l: number) => <AntTag color={l > 7 ? 'red' : l > 4 ? 'orange' : 'green'}>{l}</AntTag> }, { title: '操作', key: 'action', render: (_: any, l: Location) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'location', l)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'location', l.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'mapView', label: <span><HeatMapOutlined /> 地图可视化</span>, children: <div ref={mapRef} style={{ background: '#fafafa', borderRadius: 8, minHeight: 500 }}>{geographyData.regions.length === 0 && <Empty description="请先添加区域" />}</div> },
    { key: 'plotRoute', label: <span><NodeIndexOutlined /> 剧情路线</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'plotPoint')}>添加剧情点</Button></div><Table dataSource={geographyData.plotPoints} rowKey="id" pagination={false} columns={[{ title: '顺序', dataIndex: 'sequence', key: 'seq', width: 60 }, { title: '剧情点', dataIndex: 'name', key: 'name' }, { title: '操作', key: 'action', render: (_: any, p: PlotPoint) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'plotPoint', p)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'plotPoint', p.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> }
  ]

  const timeTabItems = [
    { key: 'eras', label: <span><HistoryOutlined /> 纪元</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'era')}>添加纪元</Button></div><Table dataSource={timeData.eras} columns={eraColumns} rowKey="id" pagination={false} /></div> },
    { key: 'events', label: <span><ClockCircleOutlined /> 历史事件</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'event')}>添加事件</Button></div><Table dataSource={timeData.events} columns={eventColumns} rowKey="id" pagination={{ pageSize: 10 }} /></div> },
    { key: 'characterAges', label: <span><UserOutlined /> 角色年龄</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'characterAge')}>添加角色</Button></div><Table dataSource={timeData.characterAges} columns={characterAgeColumns} rowKey="characterId" pagination={false} /></div> },
    { key: 'timeSkips', label: <span><ClockCircleOutlined /> 时间跳跃</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'timeSkip')}>添加时间跳跃</Button></div><Table dataSource={timeData.timeSkips} columns={timeSkipColumns} rowKey="id" pagination={false} /></div> },
    { key: 'timeline', label: <span><NodeIndexOutlined /> 时间线视图</span>, children: <div style={{ padding: 20 }}>
      <Card title="时间线" style={{ marginBottom: 16 }}>
        <Timeline mode="left">
          {timeData.events.sort((a, b) => a.year - b.year).slice(0, 20).map(evt => (
            <Timeline.Item key={evt.id} dot={<ClockCircleOutlined style={{ fontSize: 16 }} />} label={evt.year}>
              <Card size="small" title={evt.title}>
                <p>{evt.description?.slice(0, 50)}...</p>
                <p><small>{evt.location}</small></p>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
        {timeData.events.length === 0 && <Empty description="暂无历史事件" />}
      </Card>
      {(conflicts.length > 0 || warnings.length > 0 || realmAgeIssues.length > 0) && (
        <Card title="时间冲突检测" style={{ marginTop: 16 }}>
          {conflicts.length > 0 && <Alert type="error" message="冲突" description={conflicts.join('; ')} style={{ marginBottom: 8 }} icon={<WarningOutlined />} />}
          {warnings.length > 0 && <Alert type="warning" message="警告" description={warnings.join('; ')} style={{ marginBottom: 8 }} icon={<WarningOutlined />} />}
          {realmAgeIssues.length > 0 && <Alert type="info" message="建议" description={realmAgeIssues.join('; ')} icon={<InfoCircleOutlined />} />}
          {conflicts.length === 0 && warnings.length === 0 && realmAgeIssues.length === 0 && <Empty description="未检测到时间冲突" />}
        </Card>
      )}
    </div> }
  ]

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>世界观设定</h2>
        <Space>
          <Button icon={<RollbackOutlined />} onClick={handleBack}>返回</Button>
          {hasChanges && <Button onClick={handleCancel}>取消</Button>}
          <Button icon={<UndoOutlined />} onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveWorld} disabled={!hasChanges}>保存</Button>
        </Space>
      </div>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'cultivation', label: '修炼体系', children: <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}><Tabs items={cultivationTabItems} /></div> },
        { key: 'geography', label: '地理势力', children: <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}><Tabs items={geographyTabItems} /></div> },
        { key: 'time', label: '时间线', children: <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}><Tabs items={timeTabItems} /></div> }
      ]} />

      <Modal title={`${editingItem ? '编辑' : '添加'}`} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleModalOk} width={600}>
        <Form form={form} layout="vertical">{renderModalForm()}</Form>
      </Modal>
    </div>
  )
}

export default WorldEditor

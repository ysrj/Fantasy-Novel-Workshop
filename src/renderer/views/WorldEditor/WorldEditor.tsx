import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs, Input, Button, Space, message, Modal, Form, Select, Table, Tag as AntTag, Row, Col, Empty, Popconfirm, InputNumber, Card, Alert, Statistic } from 'antd'
import { PlusOutlined, SaveOutlined, RollbackOutlined, UndoOutlined, DeleteOutlined, EditOutlined, ApiOutlined, ExperimentOutlined, ToolOutlined, StarOutlined, GlobalOutlined, HomeOutlined, AimOutlined, HeatMapOutlined, NodeIndexOutlined, ClockCircleOutlined, HistoryOutlined, UserOutlined, ThunderboltOutlined, SafetyCertificateOutlined, AlertOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import * as G6 from '@antv/g6'
import type { Realm, Technique, Pill, Artifact, CultivationData, Region, Sect, Location, PlotPoint, GeographyData, Era, HistoricalEvent, CharacterAge, TimeSkip, TimeData, PowerLevel, Battle, PowerWarning, CrossRealmValidation, CombatData } from '../../shared/types'

function WorldEditor(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [cultivationData, setCultivationData] = useState<CultivationData>({ realms: [], stages: [], breakthroughs: [], techniques: [], pills: [], artifacts: [] })
  const [geographyData, setGeographyData] = useState<GeographyData>({ regions: [], sects: [], territories: [], importantLocations: [], spatialRifts: [], plotPoints: [] })
  const [timeData, setTimeData] = useState<TimeData>({ eras: [], events: [], characterAges: [], timeSkips: [], cultivationPeriods: [] })
  const [combatData, setCombatData] = useState<CombatData>({ powerScale: { levels: [], baseMultiplier: 1, realmMultiplier: {} }, battleRecords: [], warnings: [], validations: [] })
  
  const [activeTab, setActiveTab] = useState('powerLevels')
  const [hasChanges, setHasChanges] = useState(false)
  const [initialData, setInitialData] = useState<{ cultivation: CultivationData; geography: GeographyData; time: TimeData; combat: CombatData } | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<string>('')
  const [form] = Form.useForm()
  const mapRef = useRef<HTMLDivElement>(null)
  const graphInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (projectId) loadWorld()
    return () => { if (graphInstanceRef.current) graphInstanceRef.current.destroy() }
  }, [projectId])

  useEffect(() => {
    if (activeTab === 'mapView' && mapRef.current && geographyData.regions.length > 0) initMapGraph()
  }, [activeTab, geographyData])

  useEffect(() => {
    if (activeTab === 'powerCheck') runPowerValidation()
  }, [activeTab, combatData.battleRecords, combatData.powerScale])

  const loadWorld = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<any>('world:load', projectId)
      const cultivation = data?.cultivation || { realms: [], techniques: [], stages: [], breakthroughs: [] }
      const geography = data?.geography || { regions: [], sects: [], importantLocations: [], spatialRifts: [], plotPoints: [], territories: [] }
      const time = data?.time || { eras: [], events: [], characterAges: [], timeSkips: [], cultivationPeriods: [] }
      const combat = data?.combat || { powerScale: { levels: [], baseMultiplier: 1, realmMultiplier: {} }, battleRecords: [], warnings: [], validations: [] }
      
      setCultivationData({ realms: cultivation.realms || [], stages: cultivation.stages || [], breakthroughs: cultivation.breakthroughs || [], techniques: cultivation.techniques || [], pills: cultivation.pills || [], artifacts: data?.artifacts || [] })
      setGeographyData({ regions: geography.regions || [], sects: geography.sects || [], territories: geography.territories || [], importantLocations: geography.importantLocations || [], spatialRifts: geography.spatialRifts || [], plotPoints: geography.plotPoints || [] })
      setTimeData({ eras: time.eras || [], events: time.events || [], characterAges: time.characterAges || [], timeSkips: time.timeSkips || [], cultivationPeriods: time.cultivationPeriods || [] })
      setCombatData({ powerScale: combat.powerScale || { levels: [], baseMultiplier: 1, realmMultiplier: {} }, battleRecords: combat.battleRecords || [], warnings: combat.warnings || [], validations: combat.validations || [] })
      setInitialData(JSON.parse(JSON.stringify({ cultivation: { realms: cultivation.realms || [], stages: cultivation.stages || [], breakthroughs: cultivation.breakthroughs || [], techniques: cultivation.techniques || [], pills: cultivation.pills || [], artifacts: data?.artifacts || [] }, geography, time, combat })))
    } catch (error) { message.error('加载世界观失败') }
  }

  const saveWorld = async (): Promise<void> => {
    if (!projectId) return
    try {
      await window.api.invoke('world:save', projectId, {
        cultivation: { realms: cultivationData.realms, stages: cultivationData.stages, breakthroughs: cultivationData.breakthroughs, techniques: cultivationData.techniques, skills: [] },
        geography: { regions: geographyData.regions, sects: geographyData.sects, territories: geographyData.territories, importantLocations: geographyData.importantLocations, spatialRifts: geographyData.spatialRifts, plotPoints: geographyData.plotPoints },
        time: timeData,
        combat: combatData,
        pills: cultivationData.pills,
        artifacts: cultivationData.artifacts,
        history: [],
        factions: []
      })
      setHasChanges(false)
      message.success('保存成功')
    } catch (error) { message.error('保存失败') }
  }

  const handleReset = (): void => {
    if (initialData) {
      setCultivationData(initialData.cultivation)
      setGeographyData(initialData.geography)
      setTimeData(initialData.time)
      setCombatData(initialData.combat)
      setHasChanges(false)
      message.info('已重置')
    }
  }

  const handleCancel = (): void => {
    if (initialData) {
      setCultivationData(initialData.cultivation)
      setGeographyData(initialData.geography)
      setTimeData(initialData.time)
      setCombatData(initialData.combat)
      setHasChanges(false)
      message.info('已取消更改')
    }
  }

  const handleBack = (): void => {
    if (hasChanges) message.warning('您有未保存的更改')
    else navigate(-1)
  }

  const updateData = (section: string, type: string, data: any[]): void => {
    if (section === 'cultivation') setCultivationData({ ...cultivationData, [type]: data })
    else if (section === 'geography') setGeographyData({ ...geographyData, [type]: data })
    else if (section === 'time') setTimeData({ ...timeData, [type]: data })
    else if (section === 'combat') setCombatData({ ...combatData, [type]: data })
    setHasChanges(true)
  }

  const openModal = (section: string, type: string, item?: any): void => {
    setModalType(type)
    setEditingItem(item)
    setModalVisible(true)
    if (item) form.setFieldsValue(item)
    else form.resetFields()
  }

  const handleModalOk = async (): Promise<void> => {
    const values = await form.validateFields()
    const id = editingItem?.id || `${modalType}_${Date.now()}`
    const newItem = { ...values, id }
    let targetData: any[]

    switch (modalType) {
      case 'realm': targetData = editingItem ? cultivationData.realms.map(r => r.id === id ? newItem : r) : [...cultivationData.realms, { ...newItem, order: cultivationData.realms.length + 1 }]; updateData('cultivation', 'realms', targetData); break
      case 'technique': targetData = editingItem ? cultivationData.techniques.map(t => t.id === id ? newItem : t) : [...cultivationData.techniques, newItem]; updateData('cultivation', 'techniques', targetData); break
      case 'pill': targetData = editingItem ? cultivationData.pills.map(p => p.id === id ? newItem : p) : [...cultivationData.pills, newItem]; updateData('cultivation', 'pills', targetData); break
      case 'artifact': targetData = editingItem ? cultivationData.artifacts.map(a => a.id === id ? newItem : a) : [...cultivationData.artifacts, newItem]; updateData('cultivation', 'artifacts', targetData); break
      case 'region': targetData = editingItem ? geographyData.regions.map(r => r.id === id ? newItem : r) : [...geographyData.regions, newItem]; updateData('geography', 'regions', targetData); break
      case 'sect': targetData = editingItem ? geographyData.sects.map(s => s.id === id ? newItem : s) : [...geographyData.sects, newItem]; updateData('geography', 'sects', targetData); break
      case 'location': targetData = editingItem ? geographyData.importantLocations.map(l => l.id === id ? newItem : l) : [...geographyData.importantLocations, newItem]; updateData('geography', 'importantLocations', targetData); break
      case 'rift': targetData = editingItem ? geographyData.spatialRifts.map(r => r.id === id ? newItem : r) : [...geographyData.spatialRifts, newItem]; updateData('geography', 'spatialRifts', targetData); break
      case 'plotPoint': targetData = editingItem ? geographyData.plotPoints.map(p => p.id === id ? newItem : p) : [...geographyData.plotPoints, newItem]; updateData('geography', 'plotPoints', targetData); break
      case 'era': targetData = editingItem ? timeData.eras.map(e => e.id === id ? newItem : e) : [...timeData.eras, newItem]; updateData('time', 'eras', targetData); break
      case 'event': targetData = editingItem ? timeData.events.map(e => e.id === id ? newItem : e) : [...timeData.events, newItem]; updateData('time', 'events', targetData); break
      case 'characterAge': targetData = editingItem ? timeData.characterAges.map(c => c.characterId === id ? newItem : c) : [...timeData.characterAges, newItem]; updateData('time', 'characterAges', targetData); break
      case 'timeSkip': targetData = editingItem ? timeData.timeSkips.map(t => t.id === id ? newItem : t) : [...timeData.timeSkips, newItem]; updateData('time', 'timeSkips', targetData); break
      case 'powerLevel': targetData = editingItem ? combatData.powerScale.levels.map(p => p.id === id ? newItem : p) : [...combatData.powerScale.levels, newItem]; setCombatData({ ...combatData, powerScale: { ...combatData.powerScale, levels: targetData } }); break
      case 'battle': targetData = editingItem ? combatData.battleRecords.map(b => b.id === id ? newItem : b) : [...combatData.battleRecords, newItem]; updateData('combat', 'battleRecords', targetData); break
    }
    setModalVisible(false)
  }

  const deleteItem = (section: string, type: string, id: string): void => {
    const keyMap: Record<string, string> = { realm: 'realms', technique: 'techniques', pill: 'pills', artifact: 'artifacts', region: 'regions', sect: 'sects', location: 'importantLocations', rift: 'spatialRifts', plotPoint: 'plotPoints', era: 'eras', event: 'events', characterAge: 'characterAges', timeSkip: 'timeSkips', powerLevel: 'levels', battle: 'battleRecords' }
    const key = keyMap[type]
    if (section === 'cultivation') setCultivationData({ ...cultivationData, [key]: cultivationData[key as keyof CultivationData as any].filter((item: any) => item.id !== id) })
    else if (section === 'geography') setGeographyData({ ...geographyData, [key]: geographyData[key as keyof GeographyData as any].filter((item: any) => item.id !== id) })
    else if (section === 'time') setTimeData({ ...timeData, [key]: timeData[key as keyof TimeData as any].filter((item: any) => item.id !== id) })
    else if (section === 'combat' && type === 'powerLevel') setCombatData({ ...combatData, powerScale: { ...combatData.powerScale, levels: combatData.powerScale.levels.filter((p: any) => p.id !== id) } })
    else if (section === 'combat') setCombatData({ ...combatData, battleRecords: combatData.battleRecords.filter((b: any) => b.id !== id) })
    setHasChanges(true)
  }

  const runPowerValidation = useMemo(() => {
    const warnings: PowerWarning[] = []
    const validations: CrossRealmValidation[] = []

    combatData.battleRecords.forEach(battle => {
      const attacker = battle.participants?.find((p: any) => p.side === 'attacker')
      const defender = battle.participants?.find((p: any) => p.side === 'defender')
      
      if (attacker && defender) {
        const powerDiff = attacker.powerLevel - defender.powerLevel
        const realmOrders = cultivationData.realms.reduce((acc, r, i) => { acc[r.name] = i; return acc; }, {} as Record<string, number>)
        const attackerRealmOrder = realmOrders[attacker.realm] || 0
        const defenderRealmOrder = realmOrders[defender.realm] || 0
        
        if (Math.abs(attackerRealmOrder - defenderRealmOrder) >= 2) {
          validations.push({
            id: `val_${battle.id}`,
            battleId: battle.id,
            higherRealm: attackerRealmOrder > defenderRealmOrder ? attacker.realm : defender.realm,
            lowerRealm: attackerRealmOrder < defenderRealmOrder ? attacker.realm : defender.realm,
            powerDifference: Math.abs(powerDiff),
            isReasonable: powerDiff > 1000,
            reason: attackerRealmOrder > defenderRealmOrder ? '高境界击败低境界需要足够战力差' : '低境界越级击败高境界需要特殊情节',
            autoApproved: powerDiff > 5000
          })
        }
        
        if (powerDiff < 0 && attackerRealmOrder > defenderRealmOrder) {
          warnings.push({
            id: `warn_${battle.id}`,
            type: 'inconsistency',
            severity: 'high',
            message: `越阶战斗不合理: ${battle.name}`,
            details: `${attacker.realm}境界的${attacker.characterId}击败${defender.realm}境界的${defender.characterId}，战力差${powerDiff}`,
            relatedCharacters: [attacker.characterId, defender.characterId],
            suggestedFix: '增加主角越阶战斗的合理性，如使用秘法、宝物或计策'
          })
        }
      }
    })

    const realmPowerAvg = cultivationData.realms.map(r => ({ realm: r.name, avgPower: (r.order + 1) * 100 }))
    const maxPower = Math.max(...realmPowerAvg.map(r => r.avgPower), 1)
    const minPower = Math.min(...realmPowerAvg.map(r => r.avgPower), 1)
    if (maxPower / minPower > 100) {
      warnings.push({
        id: 'infl_warn',
        type: 'inflation',
        severity: 'medium',
        message: '战力膨胀预警',
        details: `最高境界与最低境界战力差距超过100倍，可能存在战力崩坏`,
        relatedCharacters: [],
        suggestedFix: '建议重新评估各境界战力设定'
      })
    }

    setCombatData(prev => ({ ...prev, warnings, validations }))
  }, [combatData.battleRecords, combatData.powerScale, cultivationData.realms])

  const initMapGraph = (): void => {
    if (!mapRef.current) return
    if (graphInstanceRef.current) graphInstanceRef.current.destroy()

    const nodes: any[] = []
    geographyData.regions.forEach((region, idx) => {
      nodes.push({ id: region.id, label: region.name, type: 'circle', size: region.size || 80, style: { fill: region.color || '#1890ff', stroke: '#666' }, x: region.coordinates?.x || (100 + idx * 150), y: region.coordinates?.y || 200 })
    })

    try {
      const G6Any = G6 as any
      const graph = new G6Any.Graph({ container: mapRef.current, width: mapRef.current.offsetWidth || 900, height: 500, fitView: true, modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node'] } })
      graph.data({ nodes, edges: [] })
      graph.render()
      graphInstanceRef.current = graph
    } catch (e) { console.error('Graph error:', e) }
  }

  const renderModalForm = () => {
    switch (modalType) {
      case 'powerLevel': return (<><Form.Item name="realm" label="境界" rules={[{ required: true }]}><Input placeholder="如：练气、筑基" /></Form.Item><Form.Item name="stage" label="阶段"><Input placeholder="如：前期、中期、后期" /></Form.Item><Row gutter={16}><Col span={12}><Form.Item name="value" label="境界值"><InputNumber style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="combatPower" label="战力值"><InputNumber style={{ width: '100%' }} /></Form.Item></Col></Row><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item></>)
      case 'battle': return (<><Form.Item name="name" label="战斗名称" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="chapter" label="章节"><Input placeholder="发生章节" /></Form.Item><Form.Item name="location" label="地点"><Input /></Form.Item><Form.Item name="result" label="结果"><Select options={[{ value: 'win', label: '胜利' }, { value: 'lose', label: '失败' }, { value: 'draw', label: '平手' }, { value: 'unknown', label: '未知' }]} /></Form.Item><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item></>)
      default: return null
    }
  }

  const powerLevelColumns = [
    { title: '境界', dataIndex: 'realm', key: 'realm', render: (t: string) => <AntTag color="blue">{t}</AntTag> },
    { title: '阶段', dataIndex: 'stage', key: 'stage' },
    { title: '境界值', dataIndex: 'value', key: 'value' },
    { title: '战力', dataIndex: 'combatPower', key: 'combatPower' },
    { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true },
    { title: '操作', key: 'action', render: (_: any, r: PowerLevel) => <Space><Button size="small" type="link" onClick={() => openModal('combat', 'powerLevel', r)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('combat', 'powerLevel', r.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }
  ]

  const battleColumns = [
    { title: '战斗', dataIndex: 'name', key: 'name' },
    { title: '章节', dataIndex: 'chapter', key: 'chapter' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    { title: '结果', dataIndex: 'result', key: 'result', render: (r: string) => {
      const color = r === 'win' ? 'green' : r === 'lose' ? 'red' : 'orange'
      const text = r === 'win' ? '胜利' : r === 'lose' ? '失败' : r === 'draw' ? '平手' : '未知'
      return <AntTag color={color}>{text}</AntTag>
    }},
    { title: '操作', key: 'action', render: (_: any, b: Battle) => <Space><Button size="small" type="link" onClick={() => openModal('combat', 'battle', b)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('combat', 'battle', b.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }
  ]

  const validationColumns = [
    { title: '高境界', dataIndex: 'higherRealm', key: 'higherRealm' },
    { title: '低境界', dataIndex: 'lowerRealm', key: 'lowerRealm' },
    { title: '战力差', dataIndex: 'powerDifference', key: 'powerDiff' },
    { title: '合理性', dataIndex: 'isReasonable', key: 'reasonable', render: (r: boolean) => r ? <><CheckCircleOutlined style={{ color: '#52c41a' }} /> 合理</> : <><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 不合理</> },
    { title: '原因', dataIndex: 'reason', key: 'reason' }
  ]

  const warningColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <AntTag color={t === 'inflation' ? 'orange' : t === 'inconsistency' ? 'red' : 'purple'}>{t === 'inflation' ? '战力膨胀' : t === 'inconsistency' ? '不一致' : '不可能'}</AntTag> },
    { title: '严重度', dataIndex: 'severity', key: 'severity', render: (s: string) => <AntTag color={s === 'critical' ? 'red' : s === 'high' ? 'orange' : s === 'medium' ? 'blue' : 'default'}>{s}</AntTag> },
    { title: '问题', dataIndex: 'message', key: 'message' },
    { title: '建议', dataIndex: 'suggestedFix', key: 'fix', render: (f: string) => f || '-'}
  ]

  const cultivationTabItems = [
    { key: 'realms', label: <span><ApiOutlined /> 境界</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'realm')}>添加境界</Button></div><Table dataSource={cultivationData.realms} rowKey="id" pagination={false} columns={[{ title: '境界', dataIndex: 'name', key: 'name', render: (t: string, r: Realm) => <AntTag color={r.color}>{t}</AntTag> }, { title: '描述', dataIndex: 'description', key: 'desc' }, { title: '操作', key: 'action', render: (_: any, r: Realm) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'realm', r)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'realm', r.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'techniques', label: <span><StarOutlined /> 功法</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'technique')}>添加功法</Button></div><Table dataSource={cultivationData.techniques} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '功法', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type' }, { title: '境界', dataIndex: 'realm', key: 'realm' }, { title: '操作', key: 'action', render: (_: any, t: Technique) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'technique', t)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'technique', t.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'pills', label: <span><ExperimentOutlined /> 丹药</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'pill')}>添加丹药</Button></div><Table dataSource={cultivationData.pills} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '丹药', dataIndex: 'name', key: 'name' }, { title: '等级', dataIndex: 'grade', key: 'grade' }, { title: '操作', key: 'action', render: (_: any, p: Pill) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'pill', p)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'pill', p.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'artifacts', label: <span><ToolOutlined /> 法宝</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('cultivation', 'artifact')}>添加法宝</Button></div><Table dataSource={cultivationData.artifacts} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '法宝', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type' }, { title: '等级', dataIndex: 'grade', key: 'grade', render: (g: string) => <AntTag color={g === 'legendary' ? 'gold' : 'blue'}>{g}</AntTag> }, { title: '操作', key: 'action', render: (_: any, a: Artifact) => <Space><Button size="small" type="link" onClick={() => openModal('cultivation', 'artifact', a)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('cultivation', 'artifact', a.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> }
  ]

  const geographyTabItems = [
    { key: 'regions', label: <span><GlobalOutlined /> 区域</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'region')}>添加区域</Button></div><Table dataSource={geographyData.regions} rowKey="id" pagination={false} columns={[{ title: '区域', dataIndex: 'name', key: 'name', render: (t: string, r: Region) => <AntTag color={r.color}>{t}</AntTag> }, { title: '操作', key: 'action', render: (_: any, r: Region) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'region', r)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'region', r.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'sects', label: <span><HomeOutlined /> 宗门</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'sect')}>添加宗门</Button></div><Table dataSource={geographyData.sects} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '宗门', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <AntTag color={t === 'righteous' ? 'blue' : t === 'demon' ? 'red' : 'default'}>{t}</AntTag> }, { title: '掌门', dataIndex: 'leader', key: 'leader' }, { title: '操作', key: 'action', render: (_: any, s: Sect) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'sect', s)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'sect', s.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'locations', label: <span><AimOutlined /> 秘境</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'location')}>添加地点</Button></div><Table dataSource={geographyData.importantLocations} rowKey="id" pagination={{ pageSize: 8 }} columns={[{ title: '地点', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type' }, { title: '危险', dataIndex: 'dangerLevel', key: 'dangerLevel', render: (l: number) => <AntTag color={l > 7 ? 'red' : l > 4 ? 'orange' : 'green'}>{l}</AntTag> }, { title: '操作', key: 'action', render: (_: any, l: Location) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'location', l)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'location', l.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'mapView', label: <span><HeatMapOutlined /> 地图</span>, children: <div ref={mapRef} style={{ background: '#fafafa', borderRadius: 8, minHeight: 500 }}>{geographyData.regions.length === 0 && <Empty description="请先添加区域" />}</div> },
    { key: 'plotRoute', label: <span><NodeIndexOutlined /> 剧情</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('geography', 'plotPoint')}>添加剧情点</Button></div><Table dataSource={geographyData.plotPoints} rowKey="id" pagination={false} columns={[{ title: '顺序', dataIndex: 'sequence', key: 'seq', width: 60 }, { title: '剧情点', dataIndex: 'name', key: 'name' }, { title: '操作', key: 'action', render: (_: any, p: PlotPoint) => <Space><Button size="small" type="link" onClick={() => openModal('geography', 'plotPoint', p)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('geography', 'plotPoint', p.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> }
  ]

  const timeTabItems = [
    { key: 'eras', label: <span><HistoryOutlined /> 纪元</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'era')}>添加纪元</Button></div><Table dataSource={timeData.eras} rowKey="id" pagination={false} columns={[{ title: '纪元', dataIndex: 'name', key: 'name', render: (t: string, r: Era) => <AntTag color={r.color}>{t}</AntTag> }, { title: '时间范围', key: 'range', render: (_: any, r: Era) => `${r.startYear} ~ ${r.endYear || '至今'}` }, { title: '操作', key: 'action', render: (_: any, r: Era) => <Space><Button size="small" type="link" onClick={() => openModal('time', 'era', r)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('time', 'era', r.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'events', label: <span><ClockCircleOutlined /> 事件</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'event')}>添加事件</Button></div><Table dataSource={timeData.events} rowKey="id" pagination={{ pageSize: 10 }} columns={[{ title: '年份', dataIndex: 'year', key: 'year', width: 80 }, { title: '事件', dataIndex: 'title', key: 'title' }, { title: '地点', dataIndex: 'location', key: 'location' }, { title: '操作', key: 'action', render: (_: any, e: HistoricalEvent) => <Space><Button size="small" type="link" onClick={() => openModal('time', 'event', e)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('time', 'event', e.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'characterAges', label: <span><UserOutlined /> 角色年龄</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'characterAge')}>添加角色</Button></div><Table dataSource={timeData.characterAges} rowKey="characterId" pagination={false} columns={[{ title: '角色', dataIndex: 'characterId', key: 'cid' }, { title: '年龄', dataIndex: 'currentAge', key: 'age', render: (a: number) => `${a}岁` }, { title: '修炼年限', dataIndex: 'cultivationAge', key: 'cultAge' }, { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <AntTag color={s === 'alive' ? 'green' : s === 'deceased' ? 'red' : 'orange'}>{s === 'alive' ? '在世' : s === 'deceased' ? '已故' : '失踪'}</AntTag> }, { title: '操作', key: 'action', render: (_: any, c: CharacterAge) => <Space><Button size="small" type="link" onClick={() => openModal('time', 'characterAge', c)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('time', 'characterAge', c.characterId)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> },
    { key: 'timeSkips', label: <span><ClockCircleOutlined /> 时间跳跃</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('time', 'timeSkip')}>添加跳跃</Button></div><Table dataSource={timeData.timeSkips} rowKey="id" pagination={false} columns={[{ title: '起始', dataIndex: 'startChapter', key: 'start' }, { title: '结束', dataIndex: 'endChapter', key: 'end' }, { title: '经过', key: 'duration', render: (_: any, t: TimeSkip) => `${t.timePassed}${t.unit === 'year' ? '年' : t.unit === 'month' ? '月' : '天'}` }, { title: '操作', key: 'action', render: (_: any, t: TimeSkip) => <Space><Button size="small" type="link" onClick={() => openModal('time', 'timeSkip', t)}>编辑</Button><Popconfirm title="确认?" onConfirm={() => deleteItem('time', 'timeSkip', t.id)}><Button size="small" type="link" danger>删除</Button></Popconfirm></Space> }]} /></div> }
  ]

  const combatTabItems = [
    { key: 'powerLevels', label: <span><ThunderboltOutlined /> 战力等级</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('combat', 'powerLevel')}>添加战力等级</Button></div><Table dataSource={combatData.powerScale.levels} columns={powerLevelColumns} rowKey="id" pagination={false} /></div> },
    { key: 'battleRecords', label: <span><SafetyCertificateOutlined /> 战斗记录</span>, children: <div><div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('combat', 'battle')}>添加战斗</Button></div><Table dataSource={combatData.battleRecords} columns={battleColumns} rowKey="id" pagination={{ pageSize: 10 }} /></div> },
    { key: 'powerCheck', label: <span><AlertOutlined /> 一致性检查</span>, children: <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="战斗记录" value={combatData.battleRecords.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="战力等级" value={combatData.powerScale.levels.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="警告数" value={combatData.warnings.length} valueStyle={{ color: combatData.warnings.length > 0 ? '#ff4d4f' : '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="验证项" value={combatData.validations.length} valueStyle={{ color: combatData.validations.filter(v => !v.isReasonable).length > 0 ? '#faad14' : '#52c41a' }} /></Card></Col>
      </Row>
      {combatData.warnings.length > 0 ? (
        <Card title="战力问题" style={{ marginBottom: 16 }}>
          {combatData.warnings.map(w => {
            const alertType = w.severity === 'critical' || w.severity === 'high' ? 'error' : w.severity === 'medium' ? 'warning' : 'info'
            return (
              <Alert
                key={w.id}
                type={alertType as any}
                message={w.message}
                description={
                  <>
                    <p>{w.details}</p>
                    {w.suggestedFix && <p><strong>建议:</strong> {w.suggestedFix}</p>}
                  </>
                }
                style={{ marginBottom: 8 }}
              />
            )
          })}
        </Card>
      ) : null}
      {combatData.validations.length > 0 ? (
        <Card title="跨境界战斗验证">
          {combatData.validations.length === 0 ? (
            <Empty description="暂无跨境界战斗" />
          ) : (
            <Table dataSource={combatData.validations} columns={validationColumns} rowKey="id" pagination={false} />
          )}
        </Card>
      ) : null}
      {combatData.warnings.length === 0 && combatData.validations.length === 0 ? (
        <Empty description="请添加战斗记录后运行检查" />
      ) : null}
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
        { key: 'combat', label: '战力系统', children: <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}><Tabs items={combatTabItems} /></div> },
        { key: 'cultivation', label: '修炼体系', children: <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}><Tabs items={cultivationTabItems} /></div> },
        { key: 'geography', label: '地理势力', children: <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}><Tabs items={geographyTabItems} /></div> },
        { key: 'time', label: '时间线', children: <div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}><Tabs items={timeTabItems} /></div> }
      ]} />
      <Modal title={`${editingItem ? '编辑' : '添加'}`} open={modalVisible} onCancel={() => setModalVisible(false)} onOk={handleModalOk} width={600}><Form form={form} layout="vertical">{renderModalForm()}</Form></Modal>
    </div>
  )
}

export default WorldEditor

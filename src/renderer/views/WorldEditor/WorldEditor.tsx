import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Tabs, Input, Button, Space, List, Modal, Form, message } from 'antd'
import { PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { useProjectStore } from '../../stores/projectStore'

interface WorldData {
  cultivation: {
    realms: { id: string; name: string; order: number; description: string }[]
    techniques: { id: string; name: string; realm: string; description: string }[]
    skills: { id: string; name: string; description: string }[]
  }
  geography: {
    locations: { id: string; name: string; description: string; type: string }[]
  }
  history: { id: string; year: string; title: string; description: string }[]
  artifacts: { id: string; name: string; type: string; description: string; power: string }[]
  factions: { id: string; name: string; type: string; description: string }[]
}

function WorldEditor(): JSX.Element {
  const { projectId } = useParams()
  const { currentProject } = useProjectStore()
  const [worldData, setWorldData] = useState<WorldData | null>(null)
  const [activeTab, setActiveTab] = useState('cultivation')

  useEffect(() => {
    if (projectId) {
      loadWorld()
    }
  }, [projectId])

  const loadWorld = async (): Promise<void> => {
    if (!projectId) return
    try {
      const data = await window.api.invoke<WorldData>('world:load', projectId)
      setWorldData(data)
    } catch (error) {
      message.error('加载世界观失败')
    }
  }

  const saveWorld = async (): Promise<void> => {
    if (!projectId || !worldData) return
    try {
      await window.api.invoke('world:save', projectId, worldData)
      message.success('世界观已保存')
    } catch (error) {
      message.error('保存世界观失败')
    }
  }

  if (!worldData) {
    return <div>加载中...</div>
  }

  const addRealm = (): void => {
    const newRealm = {
      id: `realm_${Date.now()}`,
      name: '新境界',
      order: worldData.cultivation.realms.length + 1,
      description: ''
    }
    setWorldData({
      ...worldData,
      cultivation: {
        ...worldData.cultivation,
        realms: [...worldData.cultivation.realms, newRealm]
      }
    })
  }

  const addLocation = (): void => {
    const newLocation = {
      id: `loc_${Date.now()}`,
      name: '新地点',
      description: '',
      type: '地域'
    }
    setWorldData({
      ...worldData,
      geography: {
        ...worldData.geography,
        locations: [...worldData.geography.locations, newLocation]
      }
    })
  }

  const addArtifact = (): void => {
    const newArtifact = {
      id: `art_${Date.now()}`,
      name: '新法宝',
      type: '法宝',
      description: '',
      power: ''
    }
    setWorldData({
      ...worldData,
      artifacts: [...worldData.artifacts, newArtifact]
    })
  }

  const addFaction = (): void => {
    const newFaction = {
      id: `fac_${Date.now()}`,
      name: '新势力',
      type: '门派',
      description: ''
    }
    setWorldData({
      ...worldData,
      factions: [...worldData.factions, newFaction]
    })
  }

  const tabItems = [
    {
      key: 'cultivation',
      label: '修炼体系',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={addRealm}>
              添加境界
            </Button>
          </div>
          <List
            dataSource={worldData.cultivation.realms}
            renderItem={(realm) => (
              <Card size="small" style={{ marginBottom: 8 }}>
                <Space style={{ width: '100%' }}>
                  <Input
                    value={realm.name}
                    onChange={(e) => {
                      const newRealms = worldData.cultivation.realms.map((r) =>
                        r.id === realm.id ? { ...r, name: e.target.value } : r
                      )
                      setWorldData({
                        ...worldData,
                        cultivation: { ...worldData.cultivation, realms: newRealms }
                      })
                    }}
                    placeholder="境界名称"
                    style={{ width: 120 }}
                  />
                  <Input.TextArea
                    value={realm.description}
                    onChange={(e) => {
                      const newRealms = worldData.cultivation.realms.map((r) =>
                        r.id === realm.id ? { ...r, description: e.target.value } : r
                      )
                      setWorldData({
                        ...worldData,
                        cultivation: { ...worldData.cultivation, realms: newRealms }
                      })
                    }}
                    placeholder="境界描述"
                    style={{ flex: 1 }}
                    rows={1}
                    autoSize
                  />
                </Space>
              </Card>
            )}
          />
        </div>
      )
    },
    {
      key: 'geography',
      label: '地理',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={addLocation}>
              添加地点
            </Button>
          </div>
          <List
            dataSource={worldData.geography.locations}
            renderItem={(loc) => (
              <Card size="small" style={{ marginBottom: 8 }}>
                <Input
                  value={loc.name}
                  onChange={(e) => {
                    const newLocs = worldData.geography.locations.map((l) =>
                      l.id === loc.id ? { ...l, name: e.target.value } : l
                    )
                    setWorldData({
                      ...worldData,
                      geography: { ...worldData.geography, locations: newLocs }
                    })
                  }}
                  placeholder="地点名称"
                  style={{ marginBottom: 8 }}
                />
                <Input.TextArea
                  value={loc.description}
                  onChange={(e) => {
                    const newLocs = worldData.geography.locations.map((l) =>
                      l.id === loc.id ? { ...l, description: e.target.value } : l
                    )
                    setWorldData({
                      ...worldData,
                      geography: { ...worldData.geography, locations: newLocs }
                    })
                  }}
                  placeholder="地点描述"
                  rows={2}
                />
              </Card>
            )}
          />
        </div>
      )
    },
    {
      key: 'artifacts',
      label: '法宝',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={addArtifact}>
              添加法宝
            </Button>
          </div>
          <List
            dataSource={worldData.artifacts}
            renderItem={(art) => (
              <Card size="small" style={{ marginBottom: 8 }}>
                <Input
                  value={art.name}
                  onChange={(e) => {
                    const newArts = worldData.artifacts.map((a) =>
                      a.id === art.id ? { ...a, name: e.target.value } : a
                    )
                    setWorldData({ ...worldData, artifacts: newArts })
                  }}
                  placeholder="法宝名称"
                  style={{ marginBottom: 8 }}
                />
                <Input.TextArea
                  value={art.description}
                  onChange={(e) => {
                    const newArts = worldData.artifacts.map((a) =>
                      a.id === art.id ? { ...a, description: e.target.value } : a
                    )
                    setWorldData({ ...worldData, artifacts: newArts })
                  }}
                  placeholder="法宝描述"
                  rows={2}
                />
              </Card>
            )}
          />
        </div>
      )
    },
    {
      key: 'factions',
      label: '势力',
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={addFaction}>
              添加势力
            </Button>
          </div>
          <List
            dataSource={worldData.factions}
            renderItem={(fac) => (
              <Card size="small" style={{ marginBottom: 8 }}>
                <Input
                  value={fac.name}
                  onChange={(e) => {
                    const newFacs = worldData.factions.map((f) =>
                      f.id === fac.id ? { ...f, name: e.target.value } : f
                    )
                    setWorldData({ ...worldData, factions: newFacs })
                  }}
                  placeholder="势力名称"
                  style={{ marginBottom: 8 }}
                />
                <Input.TextArea
                  value={fac.description}
                  onChange={(e) => {
                    const newFacs = worldData.factions.map((f) =>
                      f.id === fac.id ? { ...f, description: e.target.value } : f
                    )
                    setWorldData({ ...worldData, factions: newFacs })
                  }}
                  placeholder="势力描述"
                  rows={2}
                />
              </Card>
            )}
          />
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>世界观设定</h2>
        <Button type="primary" icon={<SaveOutlined />} onClick={saveWorld}>
          保存
        </Button>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  )
}

export default WorldEditor

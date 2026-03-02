import { useEffect, useRef, useState, useCallback } from 'react'
import * as G6 from '@antv/g6'
import { Select, Tag, Space, Button, Slider } from 'antd'

interface NovelCharacter {
  id: string
  name: string
  role?: string
  realm?: string
  faction?: string
}

interface NovelRelationship {
  source: string
  target: string
  type: string
  description?: string
  chapterId?: string
}

interface NovelRelationshipGraphProps {
  characters: NovelCharacter[]
  relationships: NovelRelationship[]
  chapterFilter?: string[]
  onNodeClick?: (character: NovelCharacter) => void
  layout?: 'force' | 'realm' | 'faction'
}

const REALM_ORDER: Record<string, number> = {
  '炼气期': 1,
  '筑基期': 2,
  '金丹期': 3,
  '元婴期': 4,
  '化神期': 5,
  '炼虚期': 6,
  '合体期': 7,
  '大乘期': 8,
  '渡劫期': 9
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  '师徒': '#1890ff',
  '师傅': '#1890ff',
  '师父': '#1890ff',
  '仇敌': '#ff4d4f',
  '敌人': '#ff4d4f',
  '对手': '#ff4d4f',
  '道侣': '#eb2f96',
  '伴侣': '#eb2f96',
  '双修': '#eb2f96',
  '兄弟': '#52c41a',
  '姐妹': '#52c41a',
  '父子': '#722ed1',
  '母子': '#722ed1',
  '同门': '#13c2c2',
  '盟友': '#52c41a',
  '下属': '#faad14',
  '主人': '#faad14'
}

const ROLE_COLORS: Record<string, string> = {
  '主角': '#1890ff',
  'protagonist': '#1890ff',
  '女主': '#eb2f96',
  'love_interest': '#eb2f96',
  '男主': '#1890ff',
  '反派': '#ff4d4f',
  'antagonist': '#ff4d4f',
  '配角': '#52c41a',
  'supporting': '#52c41a',
  '导师': '#722ed1',
  'mentor': '#722ed1',
  'minor': '#8c8c8c'
}

export function NovelRelationshipGraph({
  characters,
  relationships,
  chapterFilter,
  onNodeClick,
  layout = 'force'
}: NovelRelationshipGraphProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const [selectedLayout, setSelectedLayout] = useState(layout)
  const [realmFilter, setRealmFilter] = useState<string[]>([])
  const [relationFilter, setRelationFilter] = useState<string[]>([])
  const [nodeSize, setNodeSize] = useState(50)

  const getRealmOrder = useCallback((realm?: string): number => {
    if (!realm) return 99
    return REALM_ORDER[realm] || 50
  }, [])

  const getRelationshipColor = useCallback((type: string): string => {
    return RELATIONSHIP_COLORS[type] || '#8c8c8c'
  }, [])

  const getRoleColor = useCallback((role?: string): string => {
    if (!role) return '#8c8c8c'
    return ROLE_COLORS[role] || '#8c8c8c'
  }, [])

  const layoutByRealm = useCallback((nodes: any[]): any[] => {
    const realms = [...new Set(nodes.map(n => n.realm || '未设定'))]
    const realmY: Record<string, number> = {}
    realms.forEach((r, i) => {
      realmY[r] = i * 150 + 100
    })

    const realmGroups: Record<string, number[]> = {}
    nodes.forEach((n, i) => {
      const r = n.realm || '未设定'
      if (!realmGroups[r]) realmGroups[r] = []
      realmGroups[r].push(i)
    })

    nodes.forEach((n, i) => {
      const r = n.realm || '未设定'
      const groupIndices = realmGroups[r]
      const idxInGroup = groupIndices.indexOf(i)
      n.x = (idxInGroup - groupIndices.length / 2) * 100 + 400
      n.y = realmY[r]
    })

    return nodes
  }, [])

  const layoutByFaction = useCallback((nodes: any[]): any[] => {
    const factions = [...new Set(nodes.map(n => n.faction || '未设定'))]
    const factionX: Record<string, number> = {}
    factions.forEach((f, i) => {
      factionX[f] = i * 200 + 200
    })

    nodes.forEach((n) => {
      n.x = factionX[n.faction || '未设定'] + (Math.random() - 0.5) * 100
      n.y = 300 + (Math.random() - 0.5) * 200
    })

    return nodes
  }, [])

  const filterData = useCallback(() => {
    let filteredChars = characters
    let filteredRels = relationships

    if (realmFilter.length > 0) {
      filteredChars = filteredChars.filter(c => 
        c.realm && realmFilter.includes(c.realm)
      )
    }

    if (relationFilter.length > 0) {
      filteredRels = filteredRels.filter(r => 
        relationFilter.includes(r.type)
      )
    }

    const charIds = new Set(filteredChars.map(c => c.id))
    filteredRels = filteredRels.filter(r => 
      charIds.has(r.source) && charIds.has(r.target)
    )

    return { filteredChars, filteredRels }
  }, [characters, relationships, realmFilter, relationFilter])

  useEffect(() => {
    if (!containerRef.current || characters.length === 0) return

    if (graphRef.current) {
      graphRef.current.destroy()
    }

    const { filteredChars, filteredRels } = filterData()

    const nodes = filteredChars.map(char => ({
      id: char.id,
      label: char.name,
      realm: char.realm,
      faction: char.faction,
      role: char.role,
      size: nodeSize,
      style: {
        fill: getRoleColor(char.role),
        stroke: getRoleColor(char.role),
        lineWidth: 2
      },
      labelCfg: {
        position: 'bottom',
        offset: 8,
        style: {
          fontSize: 12,
          fill: '#333'
        }
      }
    }))

    let processedNodes = [...nodes]
    if (selectedLayout === 'realm') {
      processedNodes = layoutByRealm(processedNodes)
    } else if (selectedLayout === 'faction') {
      processedNodes = layoutByFaction(processedNodes)
    }

    const edges = filteredRels.map((rel, idx) => ({
      id: `edge-${idx}`,
      source: rel.source,
      target: rel.target,
      label: rel.type,
      type: selectedLayout === 'force' ? 'quadratic' : 'line',
      style: {
        stroke: getRelationshipColor(rel.type),
        endArrow: { fill: getRelationshipColor(rel.type) },
        lineWidth: 2
      },
      labelCfg: {
        autoRotate: true,
        style: {
          fill: getRelationshipColor(rel.type),
          fontSize: 11,
          background: {
            fill: '#fff',
            padding: [2, 4],
            radius: 2
          }
        }
      }
    }))

    const G6Any = G6 as any
    const graph = new G6Any.Graph({
      container: containerRef.current,
      width: containerRef.current.offsetWidth || 800,
      height: 600,
      fitView: true,
      fitViewPadding: 40,
      layout: selectedLayout === 'force' ? {
        type: 'force',
        preventOverlap: true,
        nodeSize: nodeSize,
        linkDistance: 150,
        alphaDecay: 0.02
      } : undefined,
      defaultNode: {
        type: 'circle'
      },
      defaultEdge: {
        type: 'quadratic'
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node']
      }
    })

    if (selectedLayout !== 'force') {
      graph.getNodes().forEach((node: any) => {
        const model = node.getModel()
        graph.updateItem(node, { x: model.x, y: model.y })
      })
    }

    graph.data({ nodes: processedNodes, edges })
    graph.render()
    graph.fitView()

    graph.on('node:click', (evt: any) => {
      const nodeId = evt.item.getID()
      const char = characters.find(c => c.id === nodeId)
      if (char && onNodeClick) {
        onNodeClick(char)
      }
    })

    graphRef.current = graph

    return () => {
      if (graphRef.current) {
        graphRef.current.destroy()
        graphRef.current = null
      }
    }
  }, [characters, relationships, selectedLayout, nodeSize, realmFilter, relationFilter, filterData, getRoleColor, getRelationshipColor, layoutByRealm, layoutByFaction, onNodeClick])

  const realms = [...new Set(characters.map(c => c.realm).filter(Boolean))]
  const relationTypes = [...new Set(relationships.map(r => r.type))]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Space>
          <span>布局:</span>
          <Select
            value={selectedLayout}
            onChange={setSelectedLayout}
            style={{ width: 100 }}
            options={[
              { value: 'force', label: '力导向' },
              { value: 'realm', label: '按境界' },
              { value: 'faction', label: '按势力' }
            ]}
          />
        </Space>

        <Space>
          <span>境界筛选:</span>
          <Select
            mode="multiple"
            placeholder="选择境界"
            value={realmFilter}
            onChange={setRealmFilter}
            style={{ minWidth: 150 }}
            options={realms.map(r => ({ value: r, label: r }))}
            allowClear
          />
        </Space>

        <Space>
          <span>关系筛选:</span>
          <Select
            mode="multiple"
            placeholder="选择关系"
            value={relationFilter}
            onChange={setRelationFilter}
            style={{ minWidth: 150 }}
            options={relationTypes.map(r => ({ value: r, label: r }))}
            allowClear
          />
        </Space>

        <Space>
          <span>节点大小:</span>
          <Slider
            min={30}
            max={80}
            value={nodeSize}
            onChange={setNodeSize}
            style={{ width: 80 }}
          />
        </Space>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        <div ref={containerRef} style={{ flex: 1, height: 600 }} />
        
        <div style={{ width: 180, padding: 16, borderLeft: '1px solid #e8e8e8', overflow: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8 }}>关系图例</h4>
            {relationTypes.slice(0, 10).map(type => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ 
                  width: 20, 
                  height: 3, 
                  background: getRelationshipColor(type),
                  marginRight: 8 
                }} />
                <Tag color={getRelationshipColor(type)}>{type}</Tag>
              </div>
            ))}
          </div>
          
          <div>
            <h4 style={{ marginBottom: 8 }}>角色类型</h4>
            {Object.entries(ROLE_COLORS).slice(0, 8).map(([role, color]) => (
              <div key={role} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  background: color,
                  marginRight: 8 
                }} />
                <span style={{ fontSize: 12 }}>{role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NovelRelationshipGraph

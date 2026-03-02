import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom'
import { Layout, Menu, Button, Space, Dropdown } from 'antd'
import {
  FileTextOutlined,
  TeamOutlined,
  GlobalOutlined,
  EditOutlined,
  BarChartOutlined,
  BookOutlined,
  SettingOutlined,
  LeftOutlined,
  UserOutlined,
  BulbOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  TagsOutlined
} from '@ant-design/icons'
import { useProjectStore } from '../../stores/projectStore'
import { useSettingsStore } from '../../stores/settingsStore'

const { Sider, Header, Content } = Layout

function Workspace(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()
  const t = useSettingsStore(state => state.getTranslations())

  const menuItems = [
    {
      key: 'outline',
      icon: <BookOutlined />,
      label: t.outline
    },
    {
      key: 'characters',
      icon: <TeamOutlined />,
      label: t.characters
    },
    {
      key: 'world',
      icon: <GlobalOutlined />,
      label: t.world
    },
    {
      key: 'writing',
      icon: <EditOutlined />,
      label: t.writing
    },
    {
      key: 'inspiration',
      icon: <BulbOutlined />,
      label: t.inspiration
    },
    {
      key: 'tags',
      icon: <TagsOutlined />,
      label: '标签'
    },
    {
      key: 'ai',
      icon: <RobotOutlined />,
      label: t.aiAssistant
    },
    {
      key: 'ai-creator',
      icon: <ThunderboltOutlined />,
      label: 'AI创作'
    },
    {
      key: 'stats',
      icon: <BarChartOutlined />,
      label: t.stats
    }
  ]

  const handleMenuClick = ({ key }: { key: string }): void => {
    navigate(`/workspace/${projectId}/${key}`)
  }

  const userMenu = (
    <Menu
      items={[
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: t.settings,
          onClick: () => navigate('/settings')
        }
      ]}
    />
  )

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={200} theme="light" style={{ borderRight: '1px solid #e8e8e8' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => navigate('/')}
            style={{ marginBottom: 8 }}
          >
            {t.backToList}
          </Button>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {currentProject?.title || ''}
          </div>
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['outline']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e8e8e8' }}>
          <Space>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Button icon={<UserOutlined />}>{t.settings}</Button>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ background: '#f5f5f5', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default Workspace

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
  RobotOutlined
} from '@ant-design/icons'
import { useProjectStore } from '../../stores/projectStore'

const { Sider, Header, Content } = Layout

function Workspace(): JSX.Element {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { currentProject } = useProjectStore()

  const menuItems = [
    {
      key: 'outline',
      icon: <BookOutlined />,
      label: '大纲'
    },
    {
      key: 'characters',
      icon: <TeamOutlined />,
      label: '角色'
    },
    {
      key: 'world',
      icon: <GlobalOutlined />,
      label: '世界观'
    },
    {
      key: 'writing',
      icon: <EditOutlined />,
      label: '正文'
    },
    {
      key: 'inspiration',
      icon: <BulbOutlined />,
      label: '灵感'
    },
    {
      key: 'ai',
      icon: <RobotOutlined />,
      label: 'AI辅助'
    },
    {
      key: 'stats',
      icon: <BarChartOutlined />,
      label: '统计'
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
          label: '设置',
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
            返回列表
          </Button>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {currentProject?.title || '未命名项目'}
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
              <Button icon={<UserOutlined />}>用户</Button>
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

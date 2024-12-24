// components/Layout.tsx
import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { useRouter } from 'next/router';
import {
  CrownFilled,
  CarOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';

// ... 其他导入保持不变 ...

const { Header, Content, Sider } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const handleMenuClick = (path: string) => {
    if (path === '/logout') {
      localStorage.removeItem('token');
      router.push('/');
      return;
    }
    router.push(path);
  };

  const menuItems = [
    {
      key: '/bus',
      icon: <CarOutlined />,
      label: '班车管理',
    },
    {
      key: '/lost-found',
      icon: <SearchOutlined />,
      label: '失物招领',
    },
    {
      key: '/orders',
      icon: <CrownFilled />,
      label: '订单管理',
    },
   
    // ... 其他菜单项 ...
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
      path: '/users',
    },
    {
      key: '/logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        padding: '0 24px', 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>滨实接送服务管理系统</h1>
      </Header>
      <AntLayout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[router.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
          />
        </Sider>
        <Content style={{ 
          padding: 24,
          margin: 0,
          minHeight: 280,
          background: '#fff'
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

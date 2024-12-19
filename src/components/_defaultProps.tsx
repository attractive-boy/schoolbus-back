import {
    ChromeFilled,
    CrownFilled,
    SmileFilled,
    TabletFilled,
  } from '@ant-design/icons';
  
  export default {
    route: {
      path: '/',
      routes: [
        {
          path: '/home',
          name: '首页项目',
          icon: <SmileFilled />,
          component: './home',
        },
        {
          path: '/orders',
          name: '订单管理',
          icon: <CrownFilled />,
          component: './orders',
        },
        {
          name: '公告管理',
          icon: <TabletFilled />,
          path: '/notice',
          component: './notice',
        },
        {
          name: '服务项目',
          icon: <TabletFilled />,
          path: '/service',
          component: './service',
        },
        {
          name: '认证码管理',
          icon: <TabletFilled />,
          path: '/auth',
          component: './auth',
        },
        {
          name: '系统设置',
          icon: <TabletFilled />,
          path: '/setting',
          component: './setting',
        },
        {
          path: '/mannage',
          name: '系统管理',
          icon: <ChromeFilled />,
          component: './mannage',
        }
      ],
    },
    location: {
      pathname: '/',
    },
    appList: [
    
    ],
  };
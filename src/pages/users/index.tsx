'use client';
import React, { useRef, useState, useEffect } from "react";
import { ActionType, ProTable } from "@ant-design/pro-components";
import { Button, Tag, Modal, Image, message, Select } from "antd";
import { get, put } from '@/services/request';
import Layout from "@/components/Layout";
import type { ProColumns } from '@ant-design/pro-components';

interface UserType {
  id: number;
  openid: string;
  nickname: string;
  avatar_url: string;
  real_name: string;
  gender: number;
  phone: string;
  id_card: string;
  user_type: number;
  driver_license: string;
  vehicle_license: string;
  car_number: string;
  car_type: string;
  car_color: string;
  service_status: number;
  verify_status: number;
  status: number;
  last_login_time: string;
  created_at: string;
}

const UsersPage = () => {
  const ref = useRef<ActionType>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getUserTypeTag = (type: number) => {
    const typeMap = {
      1: { color: 'blue', text: '普通用户' },
      2: { color: 'green', text: '司机' },
      3: { color: 'purple', text: '管理员' },
    };
    return typeMap[type as keyof typeof typeMap] || { color: 'default', text: '未知' };
  };

  const getVerifyStatusTag = (status: number) => {
    const statusMap = {
      0: { color: 'default', text: '未认证' },
      1: { color: 'processing', text: '认证中' },
      2: { color: 'success', text: '已认证' },
      3: { color: 'error', text: '认证失败' },
    };
    return statusMap[status as keyof typeof statusMap] || { color: 'default', text: '未知' };
  };

  const handleViewDetails = (record: UserType) => {
    Modal.info({
      title: '用户详情',
      width: 800,
      content: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '32px',
            background: '#f5f5f5',
            padding: '24px',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', width: '100px' }}>用户头像：</span>
              <Image 
                width={50} 
                src={record.avatar_url} 
                fallback="https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', width: '100px' }}>用户类型：</span>
              <Tag color={getUserTypeTag(record.user_type).color}>
                {getUserTypeTag(record.user_type).text}
              </Tag>
            </div>
            {record.user_type === 2 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#666', width: '100px' }}>车牌号：</span>
                  <span>{record.car_number || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#666', width: '100px' }}>车型：</span>
                  <span>{record.car_type || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#666', width: '100px' }}>驾驶证：</span>
                  {record.driver_license ? (
                    <Image width={100} src={record.driver_license} />
                  ) : '-'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#666', width: '100px' }}>行驶证：</span>
                  {record.vehicle_license ? (
                    <Image width={100} src={record.vehicle_license} />
                  ) : '-'}
                </div>
              </>
            )}
          </div>
        </div>
      ),
    });
  };

  const handleVerify = async (record: UserType, verifyStatus: number) => {
    try {
      await put(`/users/${record.id}/verify`, {
        verify_status: verifyStatus,
      }, {
        showSuccess: true,
        successMsg: '操作成功'
      });
      ref.current?.reload();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleStatusChange = async (record: UserType) => {
    try {
      await put(`/users/${record.id}/status`, {
        status: record.status === 1 ? 0 : 1,
      }, {
        showSuccess: true,
        successMsg: '操作成功'
      });
      ref.current?.reload();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleUserTypeChange = async (record: UserType, newType: number) => {
    try {
      await put(`/users/${record.id}/type`, {
        user_type: newType,
      }, {
        showSuccess: true,
        successMsg: '修改成功'
      });
      ref.current?.reload();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ProColumns<UserType>[] = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      search: false,
      align: 'center',
    },
    {
      title: '用户昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      align: 'center',
    },
    {
      title: '用户类型',
      dataIndex: 'user_type',
      key: 'user_type',
      valueType: 'select',
      valueEnum: {
        1: { text: '普通用户' },
        2: { text: '司机' },
        3: { text: '管理员' },
      },
      render: (_, record) => {
        const type = getUserTypeTag(record.user_type);
        return <Tag color={type.color}>{type.text}</Tag>;
      },
      align: 'center',
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      valueType: 'dateTime',
      search: false,
      align: 'center',
    },
    {
      title: '操作',
      valueType: 'option',
      align: 'center',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          onClick={() => handleViewDetails(record)}
        >
          查看
        </Button>,
        <Button
          key="changeType"
          type="link"
          onClick={() => {
            Modal.confirm({
              title: '修改用户类型',
              content: (
                <Select
                  defaultValue={record.user_type}
                  style={{ width: '100%', marginTop: '16px' }}
                  options={[
                    { label: '普通用户', value: 1 },
                    { label: '司机', value: 2 },
                    { label: '管理员', value: 3 },
                  ]}
                  onChange={(value) => {
                    Modal.destroyAll();
                    handleUserTypeChange(record, value);
                  }}
                />
              ),
              onOk: () => {},
            });
          }}
        >
          修改类型
        </Button>,
        record.user_type === 2 && record.verify_status === 1 && (
          <>
            <Button
              key="approve"
              type="link"
              onClick={() => handleVerify(record, 2)}
            >
              通过
            </Button>
            <Button
              key="reject"
              type="link"
              danger
              onClick={() => handleVerify(record, 3)}
            >
              拒绝
            </Button>
          </>
        ),
        <Button
          key="status"
          type="link"
          danger={record.status === 1}
          onClick={() => handleStatusChange(record)}
        >
          {record.status === 1 ? '禁用' : '启用'}
        </Button>,
      ],
    },
  ];

  return (
    <Layout>
      {isClient ? (
        <ProTable<UserType>
          actionRef={ref}
          columns={columns}
          pagination={{
            pageSize: 10,
          }}
          request={async (params) => {
            try {
              const response = await get('/users', {
                ...params,
                pageSize: params.pageSize,
                current: params.current,
              });
              
              return {
                data: response.data.list || [],
                success: true,
                total: response.data.total || 0
              };
            } catch (error) {
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          rowKey="id"
          search={{
            labelWidth: 'auto',
            defaultCollapsed: true,
            collapseRender: (collapsed, props, intl, hiddenNum) => true,
            optionRender: (searchConfig, formProps, dom) => [
              ...dom.reverse(),
            ],
          }}
          options={{
            density: true,
            fullScreen: true,
            reload: true,
            setting: true,
          }}
          scroll={{ x: 1300 }}
          dateFormatter="string"
          headerTitle="用户管理"
        />
      ) : null}
    </Layout>
  );
};

export default UsersPage; 
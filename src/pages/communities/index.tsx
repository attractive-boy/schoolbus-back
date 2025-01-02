'use client';
import React, { useRef, useState, useEffect } from "react";
import { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Form, Input, Space, Popconfirm, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { get, post, put, del } from '@/services/request';
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";

// 动态导入 ProTable 和 Modal
const ProTable = dynamic(() => import('@ant-design/pro-components').then(mod => mod.ProTable), { ssr: false });
const Modal = dynamic(() => import('antd').then(mod => mod.Modal), { ssr: false });

interface Community {
  id: string;
  name: string;
}

const CommunitiesPage = () => {
  const [form] = Form.useForm();
  const ref = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState<Community | null>(null);

  const columns: ProColumns<Community>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      valueType: 'text',
      align: 'center' as const,
    },
    {
      title: '小区名称',
      dataIndex: 'name',
      key: 'name',
      valueType: 'text',
      align: 'center' as const,
    },
    {
      title: '操作',
      valueType: 'option',
      align: 'center' as const,
      render: (_: any, record: Community) => [
        <Button key="edit" type="link" onClick={() => handleEdit(record)}>编辑</Button>,
        <Popconfirm
          key="delete"
          title="确定要删除此小区吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>,
      ],
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setModalData(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: Community) => {
    setModalData(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (record: Community) => {
    try {
      await del(`/communities/${record.id}`, null, {
        showSuccess: true,
        successMsg: '删除成功'
      });
      ref.current?.reload();
    } catch (error) {
      // 错误已由请求服务处理
    }
  };

  const handleSubmit = async (values: Community) => {
    try {
      if (modalData?.id) {
        await put(`/communities/${modalData.id}`, values, {
          showSuccess: true,
          successMsg: '更新成功'
        });
      } else {
        await post('/communities/add', values, {
          showSuccess: true,
          successMsg: '添加成功'
        });
      }
      setIsModalVisible(false);
      ref.current?.reload();
    } catch (error) {
      // 错误已由请求服务处理
    }
  };

  return (
    <Layout>
      <ProTable
        actionRef={ref}
        columns={columns as any}
        pagination={{ pageSize: 10 }}
        request={async (params) => {
          try {
            const response = await get('/communities', {
              ...params,
              pageSize: params.pageSize,
              current: params.current,
            });
            return {
              data: response.data || [],
              success: true,
              total: response.total || 0
            };
          } catch (error) {
            console.error('请求错误:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        rowKey="id"
        headerTitle="小区管理"
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleAdd}>
            <PlusOutlined /> 新增小区
          </Button>,
        ]}
      />

      <Modal
        title={modalData ? '编辑小区' : '新增小区'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            label="小区名称"
            name="name"
            rules={[{ required: true, message: '请输入小区名称' }]}
          >
            <Input placeholder="请输入小区名称" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default CommunitiesPage;
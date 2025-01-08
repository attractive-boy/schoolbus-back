'use client';
import React, { useEffect, useRef, useState } from "react";
import { ActionType, ProTable, EditableProTable, ProCard, ProFormField, ProFormRadio } from "@ant-design/pro-components";
import { Button, Modal, Form, Input, Select, Space, Popconfirm, Upload, message } from "antd";
import { PlusOutlined, UploadOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { get, post, put, del } from '@/services/request';
import Layout from "@/components/Layout";
import type { ProColumns } from '@ant-design/pro-components';
import type { UploadFile } from 'antd/es/upload/interface';

interface LostFound {
  id: number;
  type: 'lost' | 'found';
  title: string;
  description: string;
  images: string[];
  location: string;
  contact: string;
  status: 'open' | 'closed';
  user_id: number;
  user_name: string;
  user_avatar: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const LostFoundPage = () => {
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState<Partial<LostFound>>({});
  const [imageList, setImageList] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [editingLocation, setEditingLocation] = useState<Partial<any>>({});
  
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchLocations();
  }, []);

  const columns: ProColumns<LostFound>[] = [
    {
      title: '类型',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        lost: { text: '寻物', status: 'Warning' },
        found: { text: '招领', status: 'Success' },
      },
      align: 'center',
    },
    {
      title: '标题',
      dataIndex: 'title',
      valueType: 'text',
      align: 'center',
      hideInTable: true,
    },
    {
      title: '地点',
      dataIndex: 'location',
      valueType: 'text',
      align: 'center',
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      valueType: 'text',
      align: 'center',
      hideInTable: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        open: { text: '进行中', status: 'Processing' },
        closed: { text: '已完成', status: 'Default' },
      },
      align: 'center',
      hideInTable: true,
    },
    {
      title: '发布者',
      dataIndex: 'user_name',
      valueType: 'text',
      align: 'center',
    },
    {
      title: '浏览次数',
      dataIndex: 'view_count',
      valueType: 'digit',
      align: 'center',
      hideInTable: true,
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      align: 'center',
    },
    {
      title: '操作',
      valueType: 'option',
      align: 'center',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这条记录吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const handleAdd = () => {
    form.resetFields();
    setModalData({});
    setImageList([]);
    setIsModalVisible(true);
  };

  const handleEdit = (record: LostFound) => {
    setModalData(record);
    form.setFieldsValue({
      ...record,
      images: undefined,
    });
    setImageList(record.images || []);
    setIsModalVisible(true);
  };

  const handleDelete = async (record: LostFound) => {
    try {
      await del(`/lost-found/${record.id}`, null, {
        showSuccess: true,
        successMsg: '删除成功'
      });
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由请求服务处理
    }
  };

  const handleSubmit = async (values: any) => {
    const formData = {
      ...values,
      images: imageList,
    };

    try {
      if (modalData.id) {
        await put(`/lost-found/${modalData.id}`, formData, {
          showSuccess: true,
          successMsg: '更新成功'
        });
      } else {
        await post('/lost-found', formData, {
          showSuccess: true,
          successMsg: '添加成功'
        });
      }

      setIsModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已由请求服务处理
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      message.error('图片上传失败');
      throw error;
    }
  };

  const customUploadRequest = async ({ file, onSuccess, onError }: any) => {
    try {
      const url = await handleUpload(file);
      if (url) {
        setImageList([...imageList, url]);
        onSuccess({ url });
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      onError(error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await get('/locations');
      console.log(response);
      setLocations(response || []);
    } catch (error) {
      message.error('获取地点失败');
    }
  };

  const handleAddLocation = async (values: any) => {
    try {
      await post('/locations', values);
      fetchLocations();
      setLocationModalVisible(false);
    } catch (error) {
      message.error('添加地点失败');
    }
  };

  const handleEditLocation = async (values: any) => {
    try {
      await put(`/locations/${editingLocation.id}`, values);
      fetchLocations();
      setLocationModalVisible(false);
    } catch (error) {
      message.error('编辑地点失败');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    try {
      await del(`/locations/${id}`);
      fetchLocations();
    } catch (error) {
      message.error('删除地点失败');
    }
  };

  const locationColumns: ProColumns<any>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      align: 'center' as const,
      editable: () => false,
      hideInTable: true,
    },
    {
      title: '地点名称',
      dataIndex: 'name',
      align: 'center' as const,
      editable: () => true,
    },
    {
      title: '操作',
      valueType: 'option',
      align: 'center' as const,
      render: (_: any, record: any) => [
        <a
          key="edit"
          onClick={() => {
            setEditableRowKeys([...editableKeys, record.id]);


          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除这个地点吗？"
          onConfirm={() => handleDeleteLocation((record as any).id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];



  if (!mounted) {
    return null;
  }

  

  return (
    <Layout>
      <ProTable<LostFound>
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          try {
            const response = await get('/lost-found', {
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
        }}
        dateFormatter="string"
        headerTitle="失物招领管理"
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleAdd}>
            <PlusOutlined /> 新增
          </Button>,
          <Button key="setLocation" type="primary" onClick={() => setLocationModalVisible(true)}>
            <EnvironmentOutlined /> 设置地点
          </Button>
        ]}
      />

      <Modal
        title={modalData.id ? '编辑' : '新增'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select>
              <Select.Option value="lost">寻物</Select.Option>
              <Select.Option value="found">招领</Select.Option>
            </Select>
          </Form.Item>

          {/* <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input />
          </Form.Item> */}
{/* 
          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item> */}

          <Form.Item
            label="图片"
            name="images"
          >
            <Upload
              listType="picture-card"
              fileList={imageList.map((url, index) => ({
                uid: `-${index}`,
                name: `image-${index}`,
                status: 'done',
                url,
              }))}
              customRequest={customUploadRequest}
              onChange={({ fileList }) => {
                if (fileList.length < imageList.length) {
                  const urls = fileList.map(file => file.url || file.response?.url).filter(Boolean);
                  setImageList(urls);
                }
              }}
            >
              {imageList.length < 5 && (
                <Button icon={<UploadOutlined />}>上传图片</Button>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            label="地点"
            name="location"
            rules={[{ required: true, message: '请输入地点' }]}
          >
            <Select>
              {locations.map((location) => (
                <Select.Option key={location.id} value={location.name}>{location.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* <Form.Item
            label="联系方式"
            name="contact"
            rules={[{ required: true, message: '请输入联系方式' }]}
          >
            <Input />
          </Form.Item> */}

          {/* <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="open">进行中</Select.Option>
              <Select.Option value="closed">已完成</Select.Option>
            </Select>
          </Form.Item> */}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="地点管理"
        open={locationModalVisible}
        onCancel={() => setLocationModalVisible(false)}
        footer={null}
        width={800}
      >
        <EditableProTable<any>
          columns={locationColumns}
          dataSource={locations}
          rowKey="id"
          recordCreatorProps={{
            record: () => ({ id: 0, name: '' }),
          }}
          request={async () => {
            const response = await get('/locations');
            return {
              data: response || [],
              success: true,
              total: response.length || 0
            };
          }}
          editable={{
            type: 'multiple',
            editableKeys: editableKeys,
            onChange: setEditableRowKeys,
            onValuesChange: async (record, recordList) => {
              // 这里可以移除原有的处理逻辑
            },
            onSave: async (rowKey, data, row) => {
              console.log(rowKey, data, row);
              //更新或者修改
              if(data.id != 0){
                await put(`/locations/${data.id}`, { name: data.name });
                setEditableRowKeys([...editableKeys, data.id]);
              }else{
                const res = await post('/locations', { name: data.name });
                setEditableRowKeys([...editableKeys, res.id]);
              } 
              // 刷新数据
              fetchLocations();   
            },
          }}
        />
      </Modal>
    </Layout>
  );
};

export default LostFoundPage;
'use client';
import React, { useRef, useState, useEffect } from "react";
import { ActionType, ProTable } from "@ant-design/pro-components";
import { Button, Modal, Form, Input, TimePicker, Space, Popconfirm, message, Calendar, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { get, post, put, del } from '@/services/request';
import Layout from "@/components/Layout";
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ProColumns } from '@ant-design/pro-components';
import 'dayjs/locale/zh-cn';

interface BusSchedule {
  id: string;
  route_name: string;
  service_dates: string[];
  departure_time: string;
  stops: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const BusSchedulePage = () => {
  const [form] = Form.useForm();
  const ref = useRef<ActionType>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState<any>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dayjs.locale('zh-cn');
  }, []);

  const columns: ProColumns<BusSchedule>[] = [
    {
      title: '线路名称',
      dataIndex: 'route_name',
      key: 'route_name',
      valueType: 'text',
      search: {
        transform: (value) => ({ route_name: value })
      },
      align: 'center',
    },
    {
      title: '发车时间',
      dataIndex: 'departure_time',
      key: 'departure_time',
      valueType: 'time',
      search: false,
      align: 'center',
    },
    {
      title: '停靠站点',
      dataIndex: 'stops',
      key: 'stops',
      valueType: 'text',
      search: {
        transform: (value) => ({ stops: value })
      },
      align: 'center',
      render: (_, record) => Array.isArray(record.stops) ? record.stops.join(' → ') : '',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: '运行中', status: 'Success' },
        inactive: { text: '已停运', status: 'Error' },
      },
      search: {
        transform: (value) => ({ status: value })
      },
      align: 'center',
    },
    {
      title: '操作',
      valueType: 'option',
      align: 'center' as const,
      render: (_: any, record: any) => [
        <Button
          key="edit"
          type="link"
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除此线路吗？"
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
    setSelectedDates([]);
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setModalData(record);
    form.setFieldsValue({
      ...record,
      departure_time: dayjs(record.departure_time, 'HH:mm'),
      stops: record.stops.join(', '),
    });
    setSelectedDates(record.service_dates);
    setIsModalVisible(true);
  };

  const handleDelete = async (record: any) => {
    try {
      await del(`/bus-schedules/${record.id}`, null, {
        showSuccess: true,
        successMsg: '删除成功'
      });
      ref.current?.reload();
    } catch (error) {
      // 错误已由请求服务处理
    }
  };

  const handleSubmit = async (values: any) => {
    if (selectedDates.length === 0) {
      message.error('请选择服务日期');
      return;
    }

    const formData = {
      route_name: values.route_name,
      service_dates: selectedDates,
      departure_time: values.departure_time.format('HH:mm'),
      stops: values.stops.split(',').map((stop: string) => stop.trim()),
      status: 'active',
    };

    try {
      if (modalData.id) {
        await put(`/bus-schedules/${modalData.id}`, formData, {
          showSuccess: true,
          successMsg: '更新成功'
        });
      } else {
        await post('/bus-schedules', formData, {
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

  const onDateSelect = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr].sort();
    });
  };

  const dateCellRender = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const isSelected = selectedDates.includes(dateStr);
    return (
      <div className={`date-cell ${isSelected ? 'selected' : ''}`}>
        {isSelected && <div className="selected-indicator" />}
      </div>
    );
  };

  if (!mounted) {
    return null;
  }

  return (
    <Layout>
      <ProTable<BusSchedule>
        actionRef={ref}
        columns={columns}
        pagination={{
          pageSize: 10,
        }}
        request={async (params) => {
          try {
            const response = await get('/bus-schedules', {
              ...params,
              pageSize: params.pageSize,
              current: params.current,
            });
            
            console.log('API Response:', response);
            
            return {
              data: response.data.list || [],
              success: true,
              total: response.data.total || 0
            };
          } catch (error) {
            console.error('Request Error:', error);
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
        headerTitle="班车线路管理"
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleAdd}>
            <PlusOutlined /> 新增线路
          </Button>,
        ]}
      />

      <Modal
        title={modalData.id ? '编辑线路' : '新增线路'}
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
            label="线路名称"
            name="route_name"
            rules={[{ required: true, message: '请输入线路名称' }]}
          >
            <Input placeholder="例如：市区线路1号" />
          </Form.Item>

          <Form.Item
            label="服务日期"
            required
          >
            <Calendar
              fullscreen={false}
              onSelect={onDateSelect}
              cellRender={dateCellRender}
              locale={{
                lang: {
                  locale: 'zh-cn',
                  month: '月',
                  year: '年',
                  today: '今天',
                  now: '此刻',
                  backToToday: '返回今天',
                  ok: '确定',
                  timeSelect: '选择时间',
                  dateSelect: '选择日期',
                  weekSelect: '选择周',
                  clear: '清除',
                  monthSelect: '选择月份',
                  yearSelect: '选择年份',
                  previousMonth: '上个月',
                  nextMonth: '下个月',
                  previousYear: '上一年',
                  nextYear: '下一年',
                  decadeSelect: '选择年代',
                  previousDecade: '上一年代',
                  nextDecade: '下一年代',
                  previousCentury: '上一世纪',
                  nextCentury: '下一世纪',
                  placeholder: '请选择日期',
                  shortWeekDays: ['日', '一', '二', '三', '四', '五', '六'],
                  shortMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
                },
                timePickerLocale: {
                  placeholder: '请选择时间'
                }
              }}
            />
            <div style={{ marginTop: 8 }}>
              已选择日期：
              <Space wrap>
                {selectedDates.map(date => (
                  <Tag 
                    key={date} 
                    color="blue" 
                    closable 
                    onClose={() => setSelectedDates(prev => prev.filter(d => d !== date))}
                  >
                    {date}
                  </Tag>
                ))}
              </Space>
            </div>
          </Form.Item>

          <Form.Item
            label="发车时间"
            name="departure_time"
            rules={[{ required: true, message: '请选择发车时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="停靠站点"
            name="stops"
            rules={[{ required: true, message: '请输入停靠站点' }]}
            extra="请用英文逗号分隔各个站点"
          >
            <Input.TextArea 
              placeholder="例如：起点站, 二号站, 三号站, 终点站"
              rows={4}
            />
          </Form.Item>

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

      <style>{`
        .date-cell {
          position: relative;
          height: 100%;
        }
        .selected-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(24, 144, 255, 0.1);
          border: 1px solid #1890ff;
          border-radius: 2px;
        }
      `}</style>
    </Layout>
  );
};

export default BusSchedulePage;

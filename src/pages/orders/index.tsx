'use client';
import React, { useRef, useState, useEffect } from "react";
import { ActionType, ProTable } from "@ant-design/pro-components";
import { Button, Tag, Modal, message, Calendar, DatePicker, Popconfirm } from "antd";
import { downloadExcelFile, get, put } from '@/services/request';
import Layout from "@/components/Layout";
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { DownloadOutlined } from '@ant-design/icons';
dayjs.extend(isSameOrAfter);

interface OrderType {
  id: number;
  order_no: string;
  user_id: number;
  route_id: number;
  total_amount: number;
  status: number;
  created_at: string;
  route_name: string;
  user_name: string;
  payment_status: number;
  selected_dates: string[] | null;
  trip_type: '单程' | '返程';
}

const getDayCount = (dates: string[] | null): number => {
  return dates?.length || 0;
};

const OrdersPage = () => {
  const ref = useRef<ActionType>();
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStatusTag = (status: number) => {
    const statusMap = {
      0: { color: 'blue', text: '待支付' },
      1: { color: 'green', text: '已支付' },
      2: { color: 'red', text: '已取消' },
      3: { color: 'orange', text: '已退款' },
      4: { color: 'purple', text: '退款申请中' },
    };
    return statusMap[status as keyof typeof statusMap] || { color: 'default', text: '未知状态' };
  };

  const handleViewDetails = (record: OrderType) => {
    Modal.info({
      title: '订单详情',
      width: 800,
      className: 'order-detail-modal',
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
              <span style={{ color: '#666', width: '80px' }}>订单编号：</span>
              <span style={{ fontWeight: 500 }}>{record.order_no}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', width: '80px' }}>线路名称：</span>
              <span style={{ fontWeight: 500 }}>{record.route_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', width: '80px' }}>用户姓名：</span>
              <span style={{ fontWeight: 500 }}>{record.user_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', width: '80px' }}>支付金额：</span>
              <span style={{ fontWeight: 500, color: '#f5222d' }}>¥{record.total_amount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', width: '80px' }}>创建时间：</span>
              <span style={{ fontWeight: 500 }}>{dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#666', width: '80px' }}>订单状态：</span>
              <Tag color={getStatusTag(record.status).color} style={{ margin: 0 }}>
                {getStatusTag(record.status).text}
              </Tag>
            </div>
          </div>
          <div>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: 500, 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px' 
            }}>
              行程日期安排
              <Tag color="blue" style={{ margin: 0 }}>
                共 {getDayCount(record.selected_dates)} 天
              </Tag>
            </h4>
            <Calendar
              fullscreen={false}
              disabledDate={(currentDate) => {
                return !record.selected_dates?.includes(currentDate.format('YYYY-MM-DD'));
              }}
              dateCellRender={(date) => {
                const dateStr = date.format('YYYY-MM-DD');
                const index = record.selected_dates?.indexOf(dateStr);
                if (index !== -1 && index !== undefined) {
                  return (
                    <div style={{ 
                      background: '#1890ff',
                      color: 'white',
                      borderRadius: '4px',
                      padding: '2px 4px',
                    }}>
                      Day {index + 1}
                    </div>
                  );
                }
                return null;
              }}
            />
          </div>
        </div>
      ),
    });
  };

  const handleRefund = async (record: OrderType) => {
    // 计算已使用和未使用的天数
    const today = dayjs().format('YYYY-MM-DD');
    const usedDates = record.selected_dates?.filter(date => dayjs(date).isBefore(today)) || [];
    const remainingDates = record.selected_dates?.filter(date => dayjs(date).isSameOrAfter(today)) || [];
    
    const totalDays = getDayCount(record.selected_dates);
    const usedDays = usedDates.length;
    const remainingDays = remainingDates.length;
    
    // 计算退款金额（按比例）
    const refundAmount = Number(((remainingDays / totalDays) * record.total_amount).toFixed(2));

    Modal.confirm({
      title: '退款确认',
      width: 500,
      content: (
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ marginBottom: '8px' }}>退款信息确认</h4>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>订单总金额：<span style={{ color: '#262626', fontWeight: 500 }}>¥{record.total_amount}</span></div>
              <div>总行程天数：<span style={{ color: '#262626', fontWeight: 500 }}>{totalDays}天</span></div>
              <div>已使用天数：<span style={{ color: '#262626', fontWeight: 500 }}>{usedDays}天</span></div>
              <div>剩余天数：<span style={{ color: '#262626', fontWeight: 500 }}>{remainingDays}天</span></div>
              <div>预计退款金额：<span style={{ color: '#f5222d', fontWeight: 500 }}>¥{refundAmount}</span></div>
            </div>
          </div>
          <div style={{ color: '#666', fontSize: '13px' }}>
            注：退款金额按未使用天数比例计算，实际退款金额以系统计算为准。
          </div>
        </div>
      ),
      okText: '确认退款',
      cancelText: '取消',
      onOk: async () => {
        try {
          await put(`/payment/refund/${record.id}`, {
            refundAmount,
            usedDays,
            remainingDays,
          }, {
            showSuccess: true,
            successMsg: '退款申请已提交'
          });
          ref.current?.reload();
        } catch (error) {
          message.error('退款申请失败');
        }
      }
    });
  };

  const handleExport = () => {
    if (selectedDate) {
      const year = selectedDate.year();
      const month = selectedDate.month() + 1;
      const startDate = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD');
      const endDate = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD');
      console.log(startDate, endDate);
      //发送请求
      downloadExcelFile(`/orders/export`, {
        start_time: startDate,
        end_time: endDate,
      }, {
        showSuccess: true,
        successMsg: '导出成功'
      });
    } else {
      // 提示用户选择日期
      alert('请先选择年月');
    }
  };

  const columns: ProColumns<OrderType>[] = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      copyable: true,
      search: {
        transform: (value) => ({ order_no: value })
      },
      align: 'center',
    },
    {
      title: '线路名称',
      dataIndex: 'route_name',
      key: 'route_name',
      search: {
        transform: (value) => ({ route_name: value })
      },
      align: 'center',
    },
    {
      title: '用户姓名',
      dataIndex: 'user_name',
      key: 'user_name',
      search: {
        transform: (value) => ({ user_name: value })
      },
      align: 'center',
    },
    {
      title: '支付金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      valueType: 'money',
      search: false,
      align: 'center',
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        0: { text: '待支付', status: 'Processing' },
        1: { text: '已支付', status: 'Success' },
        2: { text: '已取消', status: 'Error' },
        3: { text: '已退款', status: 'Warning' },
        4: { text: '退款申请中', status: 'Processing' },
      },
      render: (_, record) => {
        const status = getStatusTag(record.status);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      valueType: 'dateRange',
      search: {
        transform: (value) => ({ 
          start_time: value[0],
          end_time: value[1]
        })
      },
      render: (_, record) => {
        return dayjs(record.created_at).format('YYYY-MM-DD');
      },
      align: 'center',
    },
    {
      title: '行程天数',
      dataIndex: 'selected_dates',
      key: 'selected_dates',
      search: false,
      align: 'center',
      render: (_, record) => {
        return `${getDayCount(record.selected_dates)}天`;
      },
    },
    {
      title: '行程类型',
      dataIndex: 'trip_type',
      key: 'trip_type',
      valueType: 'select',
      valueEnum: {
        '单程': { text: '单程', status: 'Default' },
        '返程': { text: '返程', status: 'Default' },
      },
      search: {
        transform: (value) => ({ trip_type: value })
      },
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
            key="refund"
            type="link"
            danger
            onClick={() => handleRefund(record)}
          >
            退款
          </Button>
        ,
      ],
    },
  ];

  return (
    <Layout>
      {isClient ? (
        <ProTable<OrderType>
          actionRef={ref}
          columns={columns}
          pagination={{
            pageSize: 10,
          }}
          request={async (params) => {
            try {
              const response = await get('/orders', {
                ...params,
                pageSize: params.pageSize,
                current: params.current,
                is_admin: true,
              });
              
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
          headerTitle="订单管理"
          toolBarRender={() => [
            <Popconfirm
              title={
                <div>
                  <span>请选择导出日期：</span>
                  <DatePicker 
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)} 
                    picker="month" 
                    style={{ marginTop: '8px' }} 
                  />
                </div>
              }
              onConfirm={handleExport}
              okText="确认"
              cancelText="取消"
            >
              <Button key="add" type="primary">
                <DownloadOutlined /> 导出
              </Button>
            </Popconfirm>,
          ]}
        />
      ) : null}
    </Layout>
  );
};

export default OrdersPage;

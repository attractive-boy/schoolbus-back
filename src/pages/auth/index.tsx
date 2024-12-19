import React, { useState } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import { GetServerSideProps } from "next";
import Layout from "@/components/Layout";
import request from '../../request';
import db from "../../db"; // 引入数据库连接

interface VerificationCode {
  id: number;
  code: string;
  created_at: string;
}

interface VerificationCodesProps {
  verificationCodes: VerificationCode[];
}

const VerificationCodesPage: React.FC<VerificationCodesProps> = ({ verificationCodes }) => {
  const [isModalVisible, setIsModalVisible] = useState(false); // 控制新增弹窗
  const [form] = Form.useForm(); // 新增表单实例
  const [verificationCodeList, setVerificationCodeList] = useState<VerificationCode[]>(verificationCodes); // 认证码列表

  // 显示新增弹窗
  const showModal = () => {
    setIsModalVisible(true);
  };

  // 关闭新增弹窗
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields(); // 清空新增表单
  };

  // 提交新增认证码表单
  const handleOk = async () => {
    try {
      const values = await form.validateFields(); // 验证新增表单

      // 发送 POST 请求到 API 路由
      const response = await request('/api/auth-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: values.code }),
      });

      const newCode: VerificationCode = response[0];

      // 更新认证码列表，添加新认证码到顶部
      setVerificationCodeList([newCode, ...verificationCodeList]);

      // 显示成功消息
      message.success('认证码新增成功！');

      // 关闭新增弹窗并重置表单
      handleCancel();
    } catch (error: any) {
      console.error("新增认证码失败:", error);
      message.error(error.message || '新增认证码失败，请稍后再试。');
    }
  };

  // 删除认证码
  const handleDelete = async (id: number) => {
    try {
      // 发送 DELETE 请求到 API 路由
      await request(`/api/auth-codes/${id}`, {
        method: 'DELETE',
      });

      // 更新认证码列表，移除被删除的认证码
      setVerificationCodeList(verificationCodeList.filter((code) => code.id !== id));

      // 显示成功消息
      message.success('认证码删除成功！');
    } catch (error: any) {
      console.error("删除认证码失败:", error);
      message.error(error.message || '删除认证码失败，请稍后再试。');
    }
  };

  return (
    <Layout>
      <Button type="primary" style={{ marginBottom: "20px" }} onClick={showModal}>
        新增认证码
      </Button>

      <Table dataSource={verificationCodeList} rowKey="id">
        <Table.Column title="认证码" dataIndex="code" />
        <Table.Column
          title="创建时间"
          dataIndex="created_at"
          render={(text) => new Date(text).toLocaleString()}
        />
        <Table.Column
          title="操作"
          render={(_, record: VerificationCode) => (
            <>
              <Popconfirm
                title="确定删除此认证码吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        />
      </Table>

      {/* 新增认证码弹窗 */}
      <Modal
        title="新增认证码"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="认证码"
            rules={[{ required: true, message: "请输入认证码" }]}
          >
            <Input placeholder="请输入认证码" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

// 服务端渲染，获取认证码数据
export const getServerSideProps: GetServerSideProps = async () => {
  const verificationCodes = await db("auth_codes").select("*");

  return {
    props: {
      verificationCodes: verificationCodes.map((code: any) => ({
        id: code.id,
        code: code.code,
        created_at: new Date(code.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
      })),
    },
  };
};

export default VerificationCodesPage;

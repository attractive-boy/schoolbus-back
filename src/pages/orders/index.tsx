import React, { useRef, useState } from "react";
import { ActionType, ProTable } from "@ant-design/pro-components";
import {
  Button,
  Modal,
  Form,
  Col,
  Row,
  Input,
  Space,
  Radio,
  Popconfirm,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import request from "umi-request";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import db from "../../db";
import Layout from "@/components/Layout"; // 确保路径正确

// 辅助函数用于格式化时间
function formatDateTime(dateString: string | number | Date) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
const CompanyInfoTable = ({ receiptContent }: any) => {
  console.log(receiptContent);
  const [pagination, setPagination] = useState({
    current: 1, // 当前页
    pageSize: 10, // 每页显示的条数
  });
  const ref = useRef<ActionType>();
  const pageSizeOptions = [5, 10, 20, 50];
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [modalData, setModalData] = useState<any>({});
  const [selectedStatus, setSelectedStatus] = useState("");
  const columns: any = [
    {
      title: "法人名称", // LegalPersonName
      dataIndex: "LegalPersonName",
      key: "LegalPersonName",
      valueType: "text",
      search: true, // 可在搜索表单中显示
      align: "center",
    },
    {
      title: "企业名称", // CompanyName
      dataIndex: "CompanyName",
      key: "CompanyName",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "认证码", // CertificationCode
      dataIndex: "CertificationCode",
      key: "CertificationCode",
      valueType: "text",
      search: false, // 是否在搜索中显示
      align: "center",
    },
    {
      title: "手机号", // PhoneNumber
      dataIndex: "PhoneNumber",
      key: "PhoneNumber",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "证件号", // IDCardNumber
      dataIndex: "IDCardNumber",
      key: "IDCardNumber",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "营业额", // Revenue
      dataIndex: "Revenue",
      key: "Revenue",
      valueType: "money", // 金额类型显示
      search: false,
      align: "center",
    },
    {
      title: "服务项目", // ServiceItems
      dataIndex: "ServiceItems",
      key: "ServiceItems",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "支付方式", // PaymentMethod
      dataIndex: "PaymentMethod",
      key: "PaymentMethod",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "是否支付", // IsPaid
      dataIndex: "IsPaid",
      key: "IsPaid",
      valueType: "select", // 下拉选择项
      valueEnum: {
        0: { text: "未支付", status: "Error" },
        1: { text: "已支付", status: "Success" },
        2: { text: "已退款", status: "Error" },
      },
      search: true,
      align: "center",
    },
    {
      title: "支付时间", // PaymentTime
      dataIndex: "PaymentTime",
      key: "PaymentTime",
      valueType: "dateTime",
      search: false,
      align: "center",
    },
    {
      title: "服务项目金额", // ServiceItemsAmount
      dataIndex: "ServiceItemsAmount",
      key: "ServiceItemsAmount",
      valueType: "money",
      search: false,
      align: "center",
    },
    {
      title: "优惠金额", // DiscountAmount
      dataIndex: "DiscountAmount",
      key: "DiscountAmount",
      valueType: "money",
      search: false,
      align: "center",
    },
    {
      title: "注册时间", // RegistrationTime
      dataIndex: "RegistrationTime",
      key: "RegistrationTime",
      valueType: "date",
      search: true,
      align: "center",
    },
    {
      title: "统一社会信用代码", // UnifiedSocialCreditCode
      dataIndex: "UnifiedSocialCreditCode",
      key: "UnifiedSocialCreditCode",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "支付单号", // PaymentOrderNumber
      dataIndex: "PaymentOrderNumber",
      key: "PaymentOrderNumber",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "订单编号", // OrderNumber
      dataIndex: "OrderNumber",
      key: "OrderNumber",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "订单状态", // OrderStatus
      dataIndex: "OrderStatus",
      key: "OrderStatus",
      valueType: "text",
      search: true,
      align: "center",
    },
    {
      title: "描述", // Description
      dataIndex: "Description",
      key: "Description",
      valueType: "text",
      search: false,
      align: "center",
    },
    {
      title: "创建日期", // CreationDate
      dataIndex: "CreationDate",
      key: "CreationDate",
      valueType: "dateTime",
      search: true,
      align: "center",
    },
    {
      title: "操作",
      valueType: "option",
      render: (_: any, record: any) => [
        <Button
          type="link"
          style={{ width: "50px" }}
          onClick={() => handleView(record)}
        >
          查看
        </Button>,

        record.OrderStatus != "作废" && record.IsPaid === 1 ? (
          <Button
            type="link"
            style={{ width: "50px" }}
            onClick={() => handleReceipt(record)}
          >
            回执单
          </Button>
        ) : null,

        record.OrderStatus != "作废" ? <Popconfirm
          title="确定要将此记录作废吗？"
          onConfirm={() => handleVoid(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" style={{ width: "50px" }} danger>
            作废
          </Button>
        </Popconfirm> : null,
        record.OrderStatus != "作废" && record.IsPaid === 1 ? (
          <Button
            type="link"
            style={{ width: "50px" }}
            onClick={() => handleStatus(record)}
          >
            办理状态
          </Button>
        ) : null,
        record.OrderStatus != "作废" && record.IsPaid === 1 ? (
          <Popconfirm
          title="确定要退款吗？"
          onConfirm={() => handleRefund(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" style={{ width: "50px" }} danger>
            退款
          </Button>
        </Popconfirm> 
        ) : null,
      ],
      align: "center",
      fixed: "right",
    },
  ];

  const handleView = (record: any) => {
    setModalData(record);
    showModal(record);
  };

  const handleReceipt = (record: any) => {
    setModalData(record);
    setReceiptModalVisible(true);
  };

  const handleVoid = (record: any) => {
    // 作废操作
    updateProcessingStatus(record, "作废");
  };

  const handleStatus = (record: any) => {
    setModalData(record);
    setSelectedStatus(record.OrderStatus);
    setProcessingStatusModalVisible(true);
  };

  const handleRefund = async (record: any) => {
    // 退款操作
    console.log("退款:", record);
    try {
      // 发送退款请求到后端
      const response = await request.get('/api/payment/refund/'+record.ID );
      ref?.current?.reload();

    } catch (error) {
      console.error('处理退款请求失败:', error);
    }
  };

  const handlePaginationChange = (paginationInfo: {
    current: number;
    pageSize: number;
  }) => {
    setPagination(paginationInfo);
  };

  const showModal = (record: any) => {
    setModalData(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setReceiptModalVisible(false);
    setProcessingStatusModalVisible(false);
  };

  const maskIDCardNumber = (idCardNumber: string) => {
    if (idCardNumber?.length >= 8) {
      return `${idCardNumber.slice(0, -8)}${"*".repeat(8)}`;
    }
    return idCardNumber;
  };

  // 新增函数处理社会信用代码
  const maskUnifiedSocialCreditCode = (code: string) => {
    if (code?.length >= 5) {
      return `${code.slice(0, -5)}${"*".repeat(5)}`;
    }
    return code;
  };

  const exportToPDF = () => {
    const input = document.getElementById("table-to-export") as HTMLDivElement;
    if (!input) return;

    html2canvas(input).then((canvas: { toDataURL: (arg0: string) => any }) => {
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF();
      doc.addImage(imgData, "PNG", 10, 10, 190, 190);
      doc.save("回执单.pdf");
    });
  };

  const exportToImage = () => {
    const input = document.getElementById("table-to-export") as HTMLDivElement;
    if (!input) return;

    html2canvas(input).then((canvas: { toDataURL: () => string }) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL();
      link.download = "回执单.png"; // 下载图片的名字
      link.click();
    });
  };
  const [processingStatusModalVisible, setProcessingStatusModalVisible] =
    useState(false); // 添加此行
  // 更新状态处理函数
  const updateProcessingStatus = async (record: any, status: string) => {
    try {
      // 假设这是你的后端API端点
      const response = await request(`/api/company/${record.ID}`, {
        method: "PUT",
        data: { OrderStatus: status },
      });

      if (response.success) {
        //刷新表格
        ref?.current?.reload();
        setSelectedStatus(""); // 清空选择的状态
        setProcessingStatusModalVisible(false); // 关闭模态框
      }
    } catch (error) {
      console.error("更新状态时发生错误:", error);
    }
  };

  return (
    <Layout>
      <ProTable<any>
        actionRef={ref}
        columns={columns}
        request={async (params) => {
          const response = await request("/api/company", {
            params,
          });
          return {
            data: response.data,
            success: response.success,
            total: response.total,
          };
        }}
        rowKey="ID"
        scroll={{ x: "max-content" }}
        dateFormatter="string"
        headerTitle=""
        pagination={{
          pageSize: pagination.pageSize,
          current: pagination.current,
          pageSizeOptions, // 设置可选择的分页大小
          onChange: (current, pageSize) =>
            handlePaginationChange({ current, pageSize }),
          showSizeChanger: true, // 显示大小调整器
          showQuickJumper: true, // 快速跳转
        }}
        toolBarRender={() => []}
        search={{
          labelWidth: "auto",
          style: {
            textAlign: "center", // 搜索框居中
          },
        }}
      />
      <Modal
        title="详情"
        open={isModalVisible}
        onOk={handleCancel}
        onCancel={handleCancel}
        footer={null} // 移除默认的确认按钮
      >
        <Form layout="vertical">
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Form.Item label="法人名称">
                <Input readOnly value={modalData.LegalPersonName} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="企业名称">
                <Input readOnly value={modalData.CompanyName} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="认证码">
                <Input readOnly value={modalData.CertificationCode} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号">
                <Input readOnly value={modalData.PhoneNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="证件号">
                <Input readOnly value={modalData.IDCardNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="营业额">
                <Input readOnly value={modalData.Revenue} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="服务项目">
                <Input readOnly value={modalData.ServiceItems} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="支付方式">
                <Input readOnly value={modalData.PaymentMethod} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="是否支付">
                <Input
                  readOnly
                  value={
                    modalData.IsPaid === 1
                      ? "已支付"
                      : modalData.IsPaid === 2
                      ? "已退款"
                      : "未支付"
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="支付时间">
                <Input readOnly value={formatDateTime(modalData.PaymentTime)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="服务项目金额">
                <Input readOnly value={modalData.ServiceItemsAmount} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="优惠金额">
                <Input readOnly value={modalData.DiscountAmount} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="注册时间">
                <Input
                  readOnly
                  value={formatDateTime(modalData.RegistrationTime)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="统一社会信用代码">
                <Input readOnly value={modalData.UnifiedSocialCreditCode} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="支付单号">
                <Input readOnly value={modalData.PaymentOrderNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="订单编号">
                <Input readOnly value={modalData.OrderNumber} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="订单状态">
                <Input readOnly value={modalData.OrderStatus} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="描述">
                <Input.TextArea readOnly value={modalData.Description} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="创建日期">
                <Input
                  readOnly
                  value={formatDateTime(modalData.CreationDate)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
      {/* 回执单模态框 */}
      <Modal
        title="生成回执单"
        open={receiptModalVisible}
        onOk={handleCancel}
        width={1000}
        onCancel={handleCancel}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancel}
            style={{ marginRight: "8px" }}
          >
            取消
          </Button>,
          <Space key="export-buttons">
            <Button type="primary" onClick={exportToPDF}>
              导出为 PDF
            </Button>
            <Button type="primary" onClick={exportToImage}>
              导出为 图片
            </Button>
          </Space>,
        ]}
      >
        <Form layout="vertical">
          <div id="table-to-export" style={{ padding: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      fontSize: "large",
                      fontWeight: "bold",
                      padding: "20px",
                    }}
                  >
                    受理凭证回执单
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ textAlign: "right" }}>
                    业务受理号: {modalData.OrderNumber}
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>法人姓名</td>
                  <td>{modalData.LegalPersonName}</td>
                  <td>法人手机号</td>
                  <td>{modalData.PhoneNumber}</td>
                </tr>
                <tr>
                  <td>法人身份证号</td>
                  <td colSpan={3}>
                    {maskIDCardNumber(modalData.IDCardNumber)}
                  </td>
                </tr>
                <tr>
                  <td>营业执照全称</td>
                  <td colSpan={3}>{modalData.CompanyName}</td>
                </tr>
                <tr>
                  <td>社会信用代码</td>
                  <td colSpan={3}>
                    {maskUnifiedSocialCreditCode(
                      modalData.UnifiedSocialCreditCode
                    )}
                  </td>
                </tr>
                <tr>
                  <td>业务类型</td>
                  <td>{modalData.ServiceItems}</td>
                  <td>费用</td>
                  <td>{modalData.ServiceItemsAmount}</td>
                </tr>
                <tr>
                  <td colSpan={4}>
                    <div
                      dangerouslySetInnerHTML={{ __html: receiptContent }}
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Form>
      </Modal>
      <Modal
        title="办理状态"
        open={processingStatusModalVisible}
        onOk={() => updateProcessingStatus(modalData, selectedStatus)}
        onCancel={handleCancel}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: !selectedStatus }} // 如果没有选择状态则禁用确认按钮
      >
        <Form layout="vertical">
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Form.Item label="请选择办理状态">
                <Radio.Group
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <Radio value="办理中">办理中</Radio>
                  <Radio value="已办理">已办理</Radio>
                  <Radio value="办理失败">办理失败</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
};

export default CompanyInfoTable;

export async function getServerSideProps() {
  try {
    const receiptContent = await db("system_settings")
      .select("settingvalue")
      .where("settingkey", "=", "receiptContent")
      .first();
    console.log(receiptContent);
    return {
      props: {
        receiptContent: receiptContent?.settingvalue.toString() || "",
      },
    };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {};
  }
}

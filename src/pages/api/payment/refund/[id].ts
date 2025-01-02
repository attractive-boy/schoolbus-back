import WxPay from 'wechatpay-node-v3';
import fs from 'fs';
import knex from '../../../../db'; // 假设你的数据库连接文件
import type { NextApiRequest, NextApiResponse } from 'next';
import { Irefunds, Irefunds2 } from 'wechatpay-node-v3/dist/lib/interface';
import dayjs from 'dayjs';

// 创建微信支付客户端
const pay = new WxPay({
    appid: process.env.WECHAT_APP_ID || '',
    mchid: process.env.WECHAT_MCH_ID || '',
    publicKey: Buffer.from(process.env.WECHAT_PUBLIC_KEY || '', 'base64'),
    privateKey: Buffer.from(process.env.WECHAT_PRIVATE_KEY || '', 'base64'),
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'PUT') {
    try {
      // 从数据库查询订单信息
      const orderInfo = await knex('orders').where({ id }).first();

      if (!orderInfo) {
        return res.status(404).json({ message: '未找到订单信息' });
      }

      // 检查订单状态
      if (orderInfo.status !== 1) {
        return res.status(400).json({ message: '只有已支付的订单可以申请退款' });
      }

      // 获取支付记录
      const paymentRecord = await knex('payments')
        .where({ order_id: id })
        .where('status', 1)  // 已支付状态
        .first();

      if (!paymentRecord) {
        return res.status(404).json({ message: '未找到相关支付记录' });
      }

      // 计算退款金额
      const totalDays = orderInfo.selected_dates?.length || 0;
      if (totalDays === 0) {
        return res.status(400).json({ message: '没有可退款的天数' });
      }

      const today = dayjs().format('YYYY-MM-DD');
      const usedDates = orderInfo.selected_dates?.filter((date: string) => dayjs(date).isBefore(today)) || [];
      const remainingDates = orderInfo.selected_dates?.filter((date: string) => dayjs(date).isSameOrAfter(today)) || [];
      
      const usedDays = usedDates.length;
      const remainingDays = remainingDates.length;

      // 计算退款金额（按比例）
      const refundAmount = Number(((remainingDays / totalDays) * orderInfo.total_amount).toFixed(2));

      // 创建退款请求
      const refundData = {
        out_trade_no: paymentRecord.payment_no,
        out_refund_no: `REF${Date.now()}${Math.floor(Math.random() * 10000)}`,
        amount: {
          total: parseInt((paymentRecord.amount * 100).toString()),
          refund: refundAmount,
          currency: 'CNY',
        },
      } as Irefunds2;

      // 调用微信支付接口发起退款
      const refundResponse = await pay.refunds(refundData);
      console.log('退款请求发送成功:', refundResponse);

      // 更新订单状态为已退款
      await knex('orders').where({ id }).update({ 
        status: 3,
        refund_amount: refundAmount, // 使用计算出的退款金额
        used_days: usedDays,
        remaining_days: remainingDays,
        remark: `已退 ${remainingDates.map((date: string) => dayjs(date).day() + '日').join(', ')}`
      });
      
      // 更新支付记录状态
      await knex('payments')
        .where({ order_id: id })
        .update({ status: 2 }); // 假设 2 表示已退款状态

      // 返回成功响应
      return res.status(200).json({ 
        success: true,
        message: '退款申请已处理',
        data: refundResponse 
      });
    } catch (error) {
      console.error('处理退款请求失败:', error);
      return res.status(500).json({ 
        success: false,
        message: '处理退款请求失败', 
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
}
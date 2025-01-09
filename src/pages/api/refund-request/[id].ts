import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || '';

// 添加微信配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_SERVER_APPID,
  appSecret: process.env.WECHAT_SERVER_APPSECRET,
  templateId: "8K4PrqkO8N43JrVnuXanBGCpEpN7_QNDfxkf2HC68V4",
};

async function getStableAccessToken() {
  try {
    // 使用 GET 请求替代 POST 请求
    // const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}`;
    const url = `http://8.155.19.17:82/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}`;
    const response = await axios.get(url);
    console.log(response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('获取access_token失败:', error);
    throw error;
  }
}

// 添加发送微信消息的函数
async function sendWechatNotification(orderInfo: any, refundAmount: number) {
  try {
    // 使用新的稳定版接口获取access_token
    const accessToken = await getStableAccessToken();

    // 获取所有管理员openid
    const adminOpenIds = await db('users').where('user_type', 3).select('unionid');
    for (const admin of adminOpenIds) {
    // 获取订单相关的路线信息和用户信息
    const orderDetails = await db('orders')
      .join('bus_schedules', 'orders.route_id', 'bus_schedules.id')
      .join('users', 'orders.user_id', 'users.id')
      .where('orders.id', orderInfo.id)
      .first('bus_schedules.route_name as route_name', 'users.nickname as user_name');
    console.log(admin.unionid);
    // 发送模板消息
    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
      {
        touser: admin.unionid,
        template_id: WECHAT_CONFIG.templateId,
        data: {
          thing2: { value: orderDetails.route_name },
          thing7: { value: orderDetails.user_name },
          time6: { value: new Date().toLocaleString('zh-CN') }
        }
      }
    );
    if (response.data.errcode !== 0) {
      console.error('发送微信通知失败:', response.data);
    }
    }
  } catch (error) {
    console.error('发送微信通知失败:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    const { id } = req.query;
    const { refundAmount, usedDays, remainingDays } = req.body;
    
    // 添加调试日志
    console.log('退款请求数据:', {
        refundAmount,
        usedDays,
        remainingDays,
        body: req.body
    });

    // 更严格的输入验证
    if (refundAmount === undefined || refundAmount === null || refundAmount === '') {
        return res.status(400).json({
            success: false,
            message: '退款金额不能为空'
        });
    }

    // 确保 refundAmount 是数字
    const parsedRefundAmount = Number(refundAmount);
    if (isNaN(parsedRefundAmount)) {
        return res.status(400).json({
            success: false,
            message: '无效的退款金额'
        });
    }

    // 验证用户权限
    const userId = verifyToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 获取订单信息
    const order = await db('orders')
      .where('id', id)
      .first();

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    // 验证订单状态
    if (order.status !== 1) {
      return res.status(400).json({ message: '该订单状态不允许申请退款' });
    }

    // 开启事务
    await db.transaction(async (trx) => {
      // 更新订单状态为退款申请中
      await trx('orders')
        .where('id', id)
        .update({
          status: 4, // 退款申请中
          updated_at: new Date()
        });

      // 创建退款记录
      await trx('refunds').insert({
        order_id: id,
        refund_no: `REFUND${Date.now()}${Math.floor(Math.random() * 10000)}`,
        amount: parsedRefundAmount,
        status: 0,
        used_days: usedDays || 0,
        remaining_days: remainingDays || 0,
        created_at: new Date(),
        updated_at: new Date()
      });

      // 发送微信通知
      await sendWechatNotification(order, parsedRefundAmount);
    });

    return res.status(200).json({
      success: true,
      message: '退款申请已提交'
    });

  } catch (error) {
    console.error('退款申请失败:', error);
    return res.status(500).json({
      success: false,
      message: '退款申请失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}

function verifyToken(authHeader?: string): number | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
} 
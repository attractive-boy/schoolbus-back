import type { NextApiRequest, NextApiResponse } from 'next';
import WxPay from 'wechatpay-node-v3';
import fs from 'fs';
import db from '../../../db';
import { Ijsapi } from 'wechatpay-node-v3/dist/lib/interface';
import jwt from 'jsonwebtoken';

// 创建微信支付客户端
const pay = new WxPay({
  appid: process.env.WECHAT_APP_ID || "",
  mchid: process.env.WECHAT_MCH_ID || "",
  publicKey: Buffer.from(process.env.WECHAT_PUBLIC_KEY || '', 'base64'),
  privateKey: Buffer.from(process.env.WECHAT_PRIVATE_KEY || '', 'base64'),
});

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePostRequest(req, res);
  } else if (req.method === 'GET') {
    return handleGetRequest(req, res);
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
}

async function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { routeId, dates, totalAmount, tripType } = req.body;
    if (!routeId || !dates || !totalAmount || !tripType) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    const userId = verifyToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 创建订单
    const orderId = await createOrder(userId, routeId, totalAmount, dates, tripType);
    
    // 直接处理支付
    const order = await getOrder(orderId);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    const paymentNo = `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;
    await createPaymentRecord(orderId, paymentNo, order.total_amount);

    const wxOrder = await createWxOrder(order, paymentNo);
    console.log("wxOrder==>",wxOrder)
    
    return res.status(201).json({
      message: '订单创建成功',
      data: {
        orderId,
        paymentNo,
        ...wxOrder.data
      }
    });

  } catch (error) {
    console.error('创建订单失败:', error);
    return res.status(500).json({
      message: '创建订单失败',
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

async function createOrder(userId: number, routeId: number, totalAmount: number, dates: string[], tripType: string): Promise<number> {
  const orderNo = `ORDER${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const user_name = await db('users').where('id', userId).select('nickname').first();
  const [orderId] = await db('orders').insert({
    user_id: userId,
    route_id: routeId,
    total_amount: totalAmount,
    status: 0,
    created_at: new Date(),
    order_no: orderNo,
    selected_dates: JSON.stringify(dates),
    trip_type: tripType,
    order_user_name: user_name.nickname
  });
  return orderId;
}


async function getOrder(orderId: number) {
  return await db('orders')
    .join('users', 'orders.user_id', 'users.id')
    .where('orders.id', orderId)
    .select('orders.*', 'users.openid')
    .first();
}

async function createPaymentRecord(orderId: number, paymentNo: string, amount: number) {
  await db('payments').insert({
    order_id: orderId,
    payment_no: paymentNo,
    amount: amount,
    status: 0,
    payment_method: 'wxpay'
  });
}

async function createWxOrder(order: any, paymentNo: string) {
  const orderData: Ijsapi = {
    appid: process.env.WECHAT_APP_ID,
    mchid: process.env.WECHAT_MCH_ID,
    out_trade_no: paymentNo,
    notify_url: `https://bingshi.djjp.cn/api/payment/notify`,
    description: `乘车预约支付`,
    amount: {
      total: parseInt((order.total_amount * 100).toString())
    },
    payer: {
      openid: order.openid
    }
  };
  return await pay.transactions_jsapi(orderData);
}

async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { current = 1, pageSize = 10, order_no, route_name, user_name, status, trip_type, start_time, end_time, is_admin,ticket_month } = req.query;

    // 验证用户权限
    const userId = verifyToken(req.headers.authorization);

    // 构建基础条件
    const whereConditions = async (builder: any) => {
      if (userId && !is_admin) {
        builder.where('orders.user_id', userId);
      }
      if (order_no) {
        builder.where('orders.order_no', 'like', `%${order_no}%`);
      }
      if (route_name) {
        builder.where('bus_schedules.route_name', 'like', `%${route_name}%`);
      }
      if (user_name) {
        builder.where('users.nickname', 'like', `%${user_name}%`);
      }
      // 添加状态筛选
      if (status !== undefined && status !== '') {
        builder.where('orders.status', status);
      }
      // 添加 trip_type 筛选
      if (trip_type) {
        builder.where('orders.trip_type', trip_type);
      }
      // 添加时间范围筛选
      if (start_time && end_time) {
        builder.whereBetween('orders.created_at', [start_time, end_time]);
      }
      if(ticket_month){
        builder.where('orders.selected_dates', 'like', `%${ticket_month}%`);
      }
    };

    // 单独查询总数
    const totalQuery = db('orders')
      .join('users', 'orders.user_id', 'users.id')
      .join('bus_schedules', 'orders.route_id', 'bus_schedules.id')
      .where(whereConditions)
      .count('orders.id as total')
      .first();

    // 查询列表数据
    const listQuery = db('orders')
      .join('users', 'orders.user_id', 'users.id')
      .join('bus_schedules', 'orders.route_id', 'bus_schedules.id')
      .select(
        'orders.*',
        'users.nickname as user_name',
        'bus_schedules.route_name as route_name'
      )
      .where(whereConditions)
      .orderBy('orders.created_at', 'desc')
      .offset((Number(current) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    // 并行执行查询
    const [totalResult, list] = await Promise.all([totalQuery, listQuery]);
    // 输出查询语句
    console.log("listQuery==>",listQuery.toSQL().toNative());

    return res.status(200).json({
      success: true,
      data: {
        list,
        total: totalResult?.total || 0
      }
    });

  } catch (error) {
    console.error('获取订单列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}
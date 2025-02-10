import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return verifyTicket(req, res);
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
}

const WECHAT_CONFIG = {
    appId: process.env.WECHAT_SERVER_APPID,
    appSecret: process.env.WECHAT_SERVER_APPSECRET,
    templateId: "ZJytC4i864IDhkWXMQx79EcM17b8cYRx_SU96GOHPQE",
  };

async function verifyTicket(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { ticketCode } = req.body;
    if (!ticketCode) {
      return res.status(400).json({ message: '缺少车票代码' });
    }

    const userId = verifyToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 获取可用线路 route_name
    const availableRoutes = await db('users')
      .leftJoin('orders', 'users.id', 'orders.user_id')
      .leftJoin('bus_schedules', 'orders.route_id', 'bus_schedules.id')
      .where('qrcode', ticketCode)
      .where('orders.status', 1)
      .select('bus_schedules.route_name', 'orders.selected_dates', 'users.id', 'users.avatar_url', 'users.nickname');

    //获取今天的日期 yyyy-mm-dd
    const today = new Date().toISOString().split('T')[0];
    // 检查今天是否在 selected_dates 中
    const isTodaySelected = availableRoutes.filter(route => route.selected_dates.includes(today));
    if (isTodaySelected.length === 0) {
      return res.status(400).json({ message: '今天没有乘车计划' });
    }

    //如果是单程 一天只允许验票一次 
    let trip_type = '单程'
    for(var item of isTodaySelected){
      if (item.trip_type == '往返') {
        trip_type = '往返'
        break;
      }
    }

    if (trip_type == '单程') {
      // 判断今天是否已经验票
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置为当天的开始时间
    
      const tomorrow = new Date();
      tomorrow.setHours(23, 59, 59, 999); // 设置为当天的结束时间
    
      const countResult = await db('ticket_verification_records')
        .where('user_id', userId)
        .whereBetween('created_at', [today.toISOString(), tomorrow.toISOString()])
        .count('* as count')
        .first();
    
      if (countResult && Number(countResult.count) >= 1) {
        return res.status(400).json({ message: '今天已经验过一次票' });
      }
    }

    //判断现在是上午还是下午
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      // 获取今天上午的验票次数
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0); // 设置为当天的开始时间

      const noon = new Date();
      noon.setHours(12, 0, 0, 0); // 设置为当天中午12点

      const countResult = await db('ticket_verification_records')
        .where('user_id', userId)
        .whereBetween('created_at', [startOfDay.toISOString(), noon.toISOString()])
        .count('* as count')
        .first();

      if (countResult && Number(countResult.count) >= 1) {
        return res.status(400).json({ message: '今天上午的验票次数已达上限' });
      }

    } else {
      // 查看今天下午是否已经验过票
      const noon = new Date();
      noon.setHours(12, 0, 0, 0); // 设置为当天中午12点

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); // 设置为当天的结束时间

      const afternoonCountResult = await db('ticket_verification_records')
        .where('user_id', userId)
        .whereBetween('created_at', [noon.toISOString(), endOfDay.toISOString()])
        .count('* as count')
        .first();

      if (afternoonCountResult && Number(afternoonCountResult.count) >= 1) {
        return res.status(400).json({ message: '今天下午已经验过一次票' });
      }
    }
    

    // 获取所有路线
    const allRoutes = isTodaySelected.map(route => route.route_name);
    console.log(allRoutes);

    // 假设我们已经有了ticketInfo对象，包含了路线名称和乘车时间
    const ticketInfo = {
      route_name: allRoutes[0],
      departure_time: new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })).toLocaleString('zh-CN'),
      user_id: isTodaySelected[0].id
    };
    

    // 验证成功后发送通知
    await sendWechatNotification(ticketInfo); // 发送通知给用户

    await db('ticket_verification_records').insert({
      user_id: ticketInfo.user_id,
      created_at: new Date()
    });

    return res.status(200).json({
      valid: true,
      ticketInfo,
      availableRoutes
    });

  } catch (error) {
    console.error('验证车票失败:', error);
    return res.status(500).json({
      valid: false,
      message: '验证失败',
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
async function sendWechatNotification(ticketInfo: any) {
  try {
    const accessToken = await getStableAccessToken();

    // 获取用户的openid
    const userOpenId = await db('users').where('id', ticketInfo.user_id).select('unionid').first();
    if (!userOpenId) {
      console.error('用户未找到');
      return;
    }

    // 发送模板消息
    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
      {
        touser: userOpenId.unionid,
        template_id: WECHAT_CONFIG.templateId,
        data: {
          thing2: { value: ticketInfo.route_name }, // 乘车线路
          time3: { value: ticketInfo.departure_time }, // 乘车时间
        }
      }
    );
    if (response.data.errcode !== 0) {
      console.error('发送微信通知失败:', response.data);
    }
  } catch (error) {
    console.error('发送微信通知失败:', error);
  }
} 
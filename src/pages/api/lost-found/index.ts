import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../../db";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getLostFoundList(req, res);
    case 'POST':
      return createLostFound(req, res);
    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// 获取列表
async function getLostFoundList(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { current = 1, pageSize = 10, type, status, title, location } = req.query;
    
    let query = db('lost_found')
      .whereNull('deleted_at');

    // 添加查询条件
    if (type) {
      query = query.where('type', type);
    }
    if (status) {
      query = query.where('status', status);
    }
    if (title) {
      query = query.where('title', 'like', `%${title}%`);
    }
    if (location) {
      query = query.where('location', 'like', `%${location}%`);
    }

    // 获取总数
    const totalResult = await query.clone()
      .count('* as count')
      .first();

    // 获取分页数据
    const list = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(Number(pageSize))
      .offset((Number(current) - 1) * Number(pageSize));

    // 处理图片字段
    const formattedList = list.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
    }));

    return res.status(200).json({
      success: true,
      data: {
        list: formattedList,
        total: totalResult?.count || 0,
        current: Number(current),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取失物招领列表失败:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 创建记录
async function createLostFound(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 验证 token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role?: string; openid?: string };
    } catch (err) {
      return res.status(401).json({ success: false, message: '无效的token' });
    }

    // 获取用户信息
    let user;
    if (decoded.openid) {
      // 微信用户
      user = await db('users').where({ id: decoded.id }).first();
    } else {
      // 管理员用户
      user = await db('admin_users').where({ id: decoded.id }).first();
    }

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    const { type, title, description, images, location, contact, status } = req.body;

    // 数据验证
    if (!type || !title || !description || !location || !contact) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const [id] = await db('lost_found').insert({
      type,
      title,
      description,
      images: JSON.stringify(images || []),
      location,
      contact,
      status: status || 'open',
      user_id: user.id,
      user_name: user.nickname || user.username,
      user_avatar: user.avatar_url || '',
      view_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      data: { id },
      message: '创建成功'
    });
  } catch (error) {
    console.error('创建失物招领记录失败:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
} 
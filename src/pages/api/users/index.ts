import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { current = 1, pageSize = 10, nickname, real_name, phone, user_type, verify_status } = req.query;

      let query = db('users');

      // 添加搜索条件
      if (nickname) query = query.where('nickname', 'like', `%${nickname}%`);
      if (real_name) query = query.where('real_name', 'like', `%${real_name}%`);
      if (phone) query = query.where('phone', 'like', `%${phone}%`);
      if (user_type) query = query.where('user_type', user_type);
      if (verify_status) query = query.where('verify_status', verify_status);

      // 分别执行计数查询和数据查询
      const countQuery = query.clone().count('* as total');
      const totalResult = await countQuery.first();
      const total = totalResult?.total || 0;

      // 获取分页数据
      const list = await query
        .select('*')  // 明确指定选择所有列
        .orderBy('created_at', 'desc')
        .limit(Number(pageSize))
        .offset((Number(current) - 1) * Number(pageSize));

      return res.status(200).json({
        success: true,
        data: {
          list,
          total,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
} 
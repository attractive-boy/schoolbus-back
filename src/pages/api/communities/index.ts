import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { current = 1, pageSize = 10 } = req.query;

    try {
      const communities = await db('communities')
        .select('*')
        .limit(Number(pageSize))
        .offset((Number(current) - 1) * Number(pageSize));

      const total = await db('communities').count('* as count').first();
      return res.status(200).json({ success: true, data: communities, total: total?.count || 0 });
    } catch (error) {
      console.error('获取小区信息失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
}
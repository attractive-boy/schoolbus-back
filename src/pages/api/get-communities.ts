import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const communities = await db('communities').select('*');
      return res.status(200).json({ success: true, data: communities });
    } catch (error) {
      console.error('获取小区信息失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
} 
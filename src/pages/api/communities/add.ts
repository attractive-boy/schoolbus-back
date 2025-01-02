import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: '小区名称不能为空' });
    }

    try {
      const [id] = await db('communities').insert({ name });
      return res.status(201).json({ success: true, id });
    } catch (error) {
      console.error('添加小区失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
} 
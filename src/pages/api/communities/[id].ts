import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: '小区名称不能为空' });
    }

    try {
      await db('communities').where({ id }).update({ name });
      return res.status(200).json({ success: true, message: '更新成功' });
    } catch (error) {
      console.error('更新小区失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await db('communities').where({ id }).delete();
      return res.status(200).json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error('删除小区失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
} 
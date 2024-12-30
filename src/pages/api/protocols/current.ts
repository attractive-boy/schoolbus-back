import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db'; // 假设你有一个数据库连接文件

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // 查询当前协议内容
      const protocols = await db('protocols').select('*'); // 假设你有一个 protocols 表
      return res.status(200).json({ success: true, data: protocols });
    } catch (error) {
      console.error('获取当前协议失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db'; // 假设你有一个数据库连接文件

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 获取所有协议
    try {
      const protocols = await db('protocols').select('*'); // 假设你有一个 protocols 表
      return res.status(200).json({ success: true, data: protocols });
    } catch (error) {
      console.error('获取协议失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else if (req.method === 'POST') {
    // 创建或更新协议
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    try {
      // 检查是否存在相同类型的协议
      const existingProtocol = await db('protocols').where({ type }).first();

      if (existingProtocol) {
        // 更新现有协议
        await db('protocols').where({ type }).update({ content, updated_at: new Date() });
        return res.status(200).json({ success: true, message: '协议更新成功' });
      } else {
        // 创建新的协议
        const [id] = await db('protocols').insert({ type, content, created_at: new Date() });
        return res.status(201).json({ success: true, message: '协议创建成功', id });
      }
    } catch (error) {
      console.error('操作协议失败:', error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../db";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: '缺少必要的参数' });
    }

    try {
      // 验证 token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: '未授权' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { id: number; openid?: string };
      } catch (err) {
        return res.status(401).json({ message: '无效的token' });
      }

      // 插入新消息
      await db('messages').insert({
        sender_id: decoded.id,
        receiver_id: receiverId,
        content: content,
        created_at: new Date(),
        updated_at: new Date()
      });

      return res.status(200).json({ message: '消息发送成功' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
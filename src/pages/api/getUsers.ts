import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../db";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { nickname } = req.query;

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

      // 查询用户，支持关键字筛选，排除当前用户
      let query = db('users')
        .select('id', 'user_type', 'nickname', 'avatar_url')
        .whereNot('id', decoded.id); // 使用token中的用户ID排除当前用户

      if (nickname) {
        query = query.where('nickname', 'like', `%${nickname}%`);
      }

      const users = await query;

      return res.status(200).json(users);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
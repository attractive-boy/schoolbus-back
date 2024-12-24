import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../../../db";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      // 验证 token
    //   const token = req.headers.authorization?.split(' ')[1];
    //   if (!token) {
    //     return res.status(401).json({ message: '未授权' });
    //   }

    //   let decoded;
    //   try {
    //     decoded = jwt.verify(token, JWT_SECRET) as { id: number; user_type: number };
    //   } catch (err) {
    //     return res.status(401).json({ message: '无效的token' });
    //   }

    //   // 验证是否为管理员
    //   if (decoded.user_type !== 3) {
    //     return res.status(403).json({ message: '权限不足' });
    //   }

      const { id } = req.query;
      const { user_type } = req.body;

      // 验证用户类型值是否合法
      if (![1, 2, 3].includes(user_type)) {
        return res.status(400).json({ message: '无效的用户类型' });
      }

      // 更新用户类型
      await db('users')
        .where('id', id)
        .update({
          user_type: user_type,
          updated_at: db.fn.now()
        });

      return res.status(200).json({ message: '修改成功' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
} 
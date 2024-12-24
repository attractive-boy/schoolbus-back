import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import db from "../../../db";

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { qrCode } = req.body;
      
      // 获取并验证 JWT token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ 
          success: false, 
          message: '未提供认证token' 
        });
      }

      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      } catch (error) {
        return res.status(401).json({ 
          success: false, 
          message: 'token无效或已过期' 
        });
      }

      const userId = decoded.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: '用户未登录' 
        });
      }

      if (!qrCode) {
        return res.status(400).json({ 
          success: false, 
          message: '二维码不能为空' 
        });
      }

      // 检查二维码是否已被其他用户绑定
      const existingUser = await db('users')
        .where('qrcode', qrCode)
        .first();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该二维码已被绑定'
        });
      }

      // 更新用户的二维码信息
      await db('users')
        .where('id', userId)
        .update({
          qrcode: qrCode,
          updated_at: db.fn.now()
        });

      return res.status(200).json({
        success: true,
        message: '二维码绑定成功'
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ 
        success: false, 
        message: '服务器错误' 
      });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
} 
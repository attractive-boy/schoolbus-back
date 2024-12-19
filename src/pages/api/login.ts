// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../db"; 
import jwt from "jsonwebtoken";

// 在这里设置你的 JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || ''; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    // 查询管理员用户
    const admin = await db('admin_users') // 管理员用户表
        .where({ username, password }) // 直接比较明文密码
        .first();

    if (!admin) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    // 生成 JWT
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username,
        role: admin.role // 添加角色信息
      },
      JWT_SECRET,
      { expiresIn: '8h' } // 延长token有效期到8小时
    );

    // 返回 token 和用户信息
    return res.status(200).json({
      code: 200, 
      data: { 
        token,
        userInfo: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } else {
    // 只允许 POST 请求
    return res.status(405).json({ message: "Method Not Allowed" });
  }
}

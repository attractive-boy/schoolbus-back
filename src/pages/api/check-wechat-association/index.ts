import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: "只允许 GET 请求" });
  }

  try {
    // 从请求头获取 token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      role: string;
    };

    // 查询用户的 unionid
    const user = await db('users')
      .where({ id: decoded.id })
      .select('unionid')
      .first();

    return res.status(200).json({
      code: 200,
      data: {
        hasUnionid: !!user.unionid,
        unionid: user.unionid || null
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "无效的认证令牌" });
    }
    
    console.error('检查微信绑定状态时出错:', error);
    return res.status(500).json({ message: "服务器内部错误" });
  }
}

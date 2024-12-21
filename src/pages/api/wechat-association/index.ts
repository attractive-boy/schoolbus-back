import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../db";
import axios from "axios";
import jwt from "jsonwebtoken";

const APPID = process.env.WECHAT_SERVER_APPID || 'wx85570a9bf2385a6b';
const APPSECRET = process.env.WECHAT_SERVER_APPSECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: "只允许 GET 请求" });
  }

  try {
    const { code, token } = req.query;

    if (!code || !token) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 验证 token 并获取用户信息
    const decoded = jwt.verify(token as string, JWT_SECRET) as { id: number };
    const userId = decoded.id;

    // 使用 code 获取访问令牌
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${APPSECRET}&code=${code}&grant_type=authorization_code`;
    const tokenResponse = await axios.get(tokenUrl);
    const { access_token, openid, unionid } = tokenResponse.data;

    // if (!unionid) {
    //   return res.status(400).json({ message: "未能获取到 unionid" });
    // }

    // 更新用户的 unionid
    await db('users')
      .where({ id: userId })
      .update({ 
        unionid : openid,
        updated_at: new Date()
      });

    // 重定向到前端页面
    res.redirect(302, '/account/profile?binding=success');

  } catch (error) {
    console.error('微信关联过程中出错:', error);
    res.redirect(302, '/account/profile?binding=error');
  }
}

// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import db from "../../db"; 

const JWT_SECRET = process.env.JWT_SECRET || '';
const APP_ID = process.env.WECHAT_APP_ID; // 微信小程序的 AppID
const APP_SECRET = process.env.WECHAT_APP_SECRET; // 微信小程序的 AppSecret
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { code, user_type, nickname, avatarUrl } = req.body;

    try {
      // 使用 code 调用微信的 API 获取 openid 和 session_key
      const response = await axios.get(`https://api.weixin.qq.com/sns/jscode2session`, {
        params: {
          appid: APP_ID,
          secret: APP_SECRET,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      const { openid } = response.data;

      if (!openid) {
        return res.status(401).json({ message: '授权失败' });
      }

      // 查找或创建用户
      let user = await db('users').where({ openid }).first();
      
      if (!user) {
        // 如果用户不存在，则创建新用户
        const [id] = await db('users').insert({
          openid,
          user_type,
          nickname,
          avatar_url: avatarUrl || defaultAvatarUrl,
          created_at: new Date()
        });
        user = await db('users').where({ id }).first();
      } else {
        // 更新现有用户信息
        await db('users')
          .where({ id: user.id })
          .update({
            user_type,
            nickname,
            avatar_url: avatarUrl || defaultAvatarUrl,
            updated_at: new Date()
          });
        user = await db('users').where({ id: user.id }).first();
      }

      // 生成 JWT token
      const token = jwt.sign({ 
        id: user.id,
        openid,
        user_type 
      }, JWT_SECRET, { 
        expiresIn: '7d' 
      });

      // 返回用户信息和token
      return res.status(200).json({
        token,
        userInfo: {
          id: user.id,
          user_type: user.user_type,
          nickname: user.nickname,
          avatarUrl: user.avatar_url
        }
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

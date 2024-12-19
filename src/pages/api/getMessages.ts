import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId } = req.query;

    console.log('Received userId:', userId);

    try {
      // 查询消息，按时间排序
      let query = db('messages')
        .select('messages.id', 'messages.content', 'messages.created_at', 'users.nickname as sender_nickname', 'users.avatar_url as sender_avatar')
        .join('users', 'messages.sender_id', 'users.id')
        .where('messages.receiver_id', userId)
        .orderBy('messages.created_at', 'desc');

      const messages = await query;

      return res.status(200).json(messages);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
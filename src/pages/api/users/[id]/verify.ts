import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const { verify_status } = req.body;

      await db('users')
        .where({ id })
        .update({
          verify_status,
          updated_at: new Date()
        });

      return res.status(200).json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
} 
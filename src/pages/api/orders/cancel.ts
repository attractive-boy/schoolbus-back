import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.body;

    try {
      // 查询订单数据并进行 JOIN
      const orders = await db('orders')
        .where('id', id)
        .update({ status: 2 })

        return res.status(200).json({ message: '订单取消成功' });
    } catch (error) {
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
} 
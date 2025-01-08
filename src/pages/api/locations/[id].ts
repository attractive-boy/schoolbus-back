import { NextApiRequest, NextApiResponse } from 'next';
import { get, put, del } from '@/services/request';
import db from "../../../db";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  switch (req.method) {
    case 'PUT':
      await db('locations').where('id', id).update(req.body);
      res.status(200).json({ message: '更新成功' });
      break;
    case 'DELETE':
      await db('locations').where('id', id).delete();
      res.status(200).json({ message: '删除成功' });
      break;
    default:
      res.status(405).json({ message: '方法不允许' });
  }
};

export default handler;


import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const locations = await db('locations').select('id', 'name');
      return res.status(200).json(locations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name } = req.body;
      const location = await db('locations').insert({ name }, ['id', 'name']); 
      return res.status(201).json(location[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}




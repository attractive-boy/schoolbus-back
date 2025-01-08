import type { NextApiRequest, NextApiResponse } from 'next';
import db from "../../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  switch (req.method) {
    case 'PUT':
      return updateLostFound(req, res, id as string);
    case 'DELETE':
      return deleteLostFound(req, res, id as string);
    default:
      return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// 更新记录
async function updateLostFound(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { type, title, description, images, location, contact, status } = req.body;

    // 数据验证
    if (!type || !location) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    await db('lost_found')
      .where({ id })
      .update({
        type,
        title,
        description,
        images: JSON.stringify(images || []),
        location,
        contact,
        status,
        updated_at: new Date(),
      }); 

    return res.status(200).json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新失物招领记录失败:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 删除记录
async function deleteLostFound(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    await db('lost_found')
      .where({ id })
      .update({
        deleted_at: new Date(),
      });

    return res.status(200).json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除失物招领记录失败:', error);
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
} 
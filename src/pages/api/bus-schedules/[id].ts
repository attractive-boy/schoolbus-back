import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../db";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {


    const { id } = req.query;

    switch (req.method) {
      case 'PUT':
        // 检查 stops 是否为数组并正确格式化
        let updateData = {
          ...req.body,
          updated_at: new Date()
        };

        // 确保 departure_time 是 JSON 字符串
        if (req.body.departure_time) {
          updateData.departure_time = JSON.stringify(req.body.departure_time);
        }

        // 确保 service_dates 是 JSON 字符串
        if (req.body.service_dates) {
          updateData.service_dates = JSON.stringify(req.body.service_dates);
        }

        // 处理 stops 数据
        if (req.body.stops) {
          if (Array.isArray(req.body.stops)) {
            updateData.stops = JSON.stringify(req.body.stops);
          } else if (typeof req.body.stops === 'string') {
            updateData.stops = JSON.stringify(req.body.stops.split(',').map((s: string) => s.trim()));
          } else {
            return res.status(400).json({
              success: false,
              message: "站点数据格式不正确"
            });
          }
        }

        // 确保 daily_price 是数字类型
        if (req.body.daily_price) {
          updateData.daily_price = Number(req.body.daily_price);
        }

        const updated = await db('bus_schedules')
          .where({ id })
          .update(updateData);
          
        return res.status(200).json({
          success: true,
          data: updated
        });

      case 'DELETE':
        await db('bus_schedules')
          .where({ id })
          .update({ status: 'inactive' });
          
        return res.status(200).json({
          success: true
        });

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "服务器内部错误" });
  }
} 
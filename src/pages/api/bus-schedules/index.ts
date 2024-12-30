import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../db";
import auth from "../../../middleware/auth"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {

    switch (req.method) {
      case 'GET':
        const { current = 1, pageSize = 10, routeName, status } = req.query;
        
        let query = db('bus_schedules');
        
        const queryParams = req.query;
        const validFields = ['route_name', 'status', 'stops'];
        
        validFields.forEach(field => {
          if (queryParams[field]) {
            if (field === 'route_name'  || field === 'stops') {
              query = query.where(field, 'like', `%${queryParams[field]}%`);
            } else {
              query = query.where(field, queryParams[field]);
            }
          }
        });

        const totalResult = await query.clone()
          .count('* as count')
          .first();

        const data = await query
          .select('*')
          .orderBy('created_at', 'desc')
          .limit(Number(pageSize))
          .offset((Number(current) - 1) * Number(pageSize));

        return res.status(200).json({
          success: true,
          data: {
            list: data,
            total: totalResult?.count || 0
          }
        });

      case 'POST':
        console.log("req.body==>", req.body);
        const newSchedule = await db('bus_schedules').insert({
          route_name: req.body.route_name,
          service_dates: JSON.stringify(req.body.service_dates),
          departure_time: JSON.stringify(req.body.departure_time),
          stops: JSON.stringify(req.body.stops),
          status: req.body.status,
          daily_price: req.body.daily_price,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        return res.status(201).json({
          success: true,
          data: newSchedule
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "服务器内部错误" });
  }
}
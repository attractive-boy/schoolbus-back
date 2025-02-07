import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../db';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { start_time, end_time, status } = req.query;

    // 确保 start_time 和 end_time 是有效的字符串
    if (typeof start_time !== 'string' || typeof end_time !== 'string') {
      return res.status(400).json({ message: '无效的时间参数' });
    }

    try {
      // 查询订单数据并进行 JOIN
      const orders = await db('orders')
        .leftJoin('users', 'orders.user_id', 'users.id') // JOIN 用户表
        .leftJoin('bus_schedules', 'orders.route_id', 'bus_schedules.id') // JOIN 路线表
        .leftJoin('communities', 'communities.id', 'users.community_id') // JOIN 路线表
        .whereBetween('orders.created_at', [start_time, end_time])
        .where('orders.status', status)
        .select('orders.*', 'users.nickname as 用户姓名', 'bus_schedules.route_name as 路线名称', 'communities.name as 小区'); // 选择所需字段

      if (orders.length === 0) {
        return res.status(404).json({ message: '没有找到符合条件的订单' });
      }
      console.log(orders);
      // 处理数据以符合 Excel 格式
      const excelData = orders.map((order, index) => ({
        序号: index + 1,
        订单编号: order['order_no'],
        班级: order['用户姓名'].slice(0, 3),
        姓名: order['用户姓名'].slice(3).replace(/^班/, ''),
        上学乘车线路: order['路线名称'], // 假设订单中有上学乘车线路字段
        放学是否乘车: order['trip_type'] == '单程' ? '否' : '是', // 假设订单中有放学乘车字段
        所住小区: order['小区'], // 假设订单中有小区字段
        本月购票情况: '已购 ' + Array.from(new Set(order['selected_dates'].map((date: string) => date.split('-')[1] + '月'))).join('、'),
        本月退票情况: order['remark'], // 假设订单中有退票情况字段
        订单金额: order['total_amount'],
        退款金额: order['refund_amount'],
      }));

      // 创建工作簿和工作表
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${start_time}至${end_time}的订单统计`);

      // 处理文件名，移除无效字符
      const safeStartTime = start_time.replace(/[<>:"/\\|?*]/g, '_').trim();
      console.log(safeStartTime);
      const safeEndTime = end_time.replace(/[<>:"/\\|?*]/g, '_').trim();
      console.log(safeEndTime);
      const safeFileName = `${safeStartTime}至${safeEndTime}的订单统计_${new Date().toISOString().split('T')[0]}.xlsx`;
      console.log(safeFileName);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFileName)}"`);
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.status(200).send(buffer);
    } catch (error) {
      console.error('导出订单失败:', error);
      return res.status(500).json({ message: '服务器错误' });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
} 
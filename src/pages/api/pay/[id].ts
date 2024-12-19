import type { NextApiRequest, NextApiResponse } from 'next';
import WxPay from 'wechatpay-node-v3';
import fs from 'fs';
import knex from '../../../db'; // 假设你的数据库连接文件
import { Ijsapi } from 'wechatpay-node-v3/dist/lib/interface';
import db from '../../../db';

// 创建微信支付客户端
const pay = new WxPay({
  appid: process.env.WECHAT_APP_ID || "",
  mchid: process.env.WECHAT_MCH_ID || "",
  publicKey: fs.readFileSync('src/certificate/apiclient_cert.pem'), // 公钥
  privateKey: fs.readFileSync('src/certificate/apiclient_key.pem'), // 秘钥
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request:', req.method, req.url);
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // 从数据库查询公司信息
      const companyInfo = await knex('CompanyInfo').where({ id }).first();

      if (!companyInfo) {
        return res.status(404).json({ message: '未找到公司信息' });
      }

      // 提取相关信息
      const { OrderNumber, ServiceItemsAmount, DiscountAmount, ServiceItems, userid } = companyInfo;

      // 这里可以定义你的订单信息，确保有必要的字段
      const PaymentOrderNumber = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const totalAmount = ServiceItemsAmount - DiscountAmount; // 计算实际支付金额
      const description = `服务项目: ${ServiceItems}`; // 商品描述
      const { openid } = await knex('users').where({ id: userid }).first();
      console.log("openid=>", openid)
      // 创建订单请求
      const orderData : Ijsapi = {
        out_trade_no: PaymentOrderNumber, // 商户订单号
        notify_url: `${process.env.BASE_URL}/api/payment/notify`, // 交易完成后通知的 URL
        description: description, // 如果Ijsapi需要description
        amount: {total: parseInt((totalAmount * 100).toString())}, // 如果Ijsapi需要amount
        payer: {openid}, 
      };

      await db('CompanyInfo').where({id}).update({
        paymentOrderNumber: PaymentOrderNumber,
        PaymentMethod : "微信支付",
      });

      // 调用微信支付接口创建订单
      const order = await pay.transactions_jsapi(orderData);
      console.log('Order created:', order);

      return res.status(200).json({ data: order.data });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: '创建订单失败', error });
    }
  } else {
    return res.status(405).json({ message: '方法不允许' });
  }
}

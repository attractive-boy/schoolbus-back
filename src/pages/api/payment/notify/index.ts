import WxPay from 'wechatpay-node-v3';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../db';

// 创建微信支付客户端
const pay = new WxPay({
  appid: process.env.WECHAT_APP_ID || '',
  mchid: process.env.WECHAT_MCH_ID || '',
  publicKey: Buffer.from(process.env.WECHAT_PUBLIC_KEY || '', 'base64'),
  privateKey: Buffer.from(process.env.WECHAT_PRIVATE_KEY || '', 'base64'),
  key: process.env.WECHAT_PAY_KEY || '',
});

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  console.log("paymentreq=>",req)
  if (req.method === 'POST') {
    try {
        // 从请求头中获取微信支付签名和消息体
      const signature = req.headers['wechatpay-signature'];
      const timestamp = req.headers['wechatpay-timestamp'];
      const nonce = req.headers['wechatpay-nonce'];
      const serialNo = req.headers['wechatpay-serial'];
      const body = req.body;

      // 验证通知的真实性
      const isValidSignature = await pay.verifySign({
        timestamp: timestamp?.toString() || '',
        nonce: nonce?.toString() || '',
        body: body,
        serial: serialNo?.toString() || '',
        signature: signature?.toString() || '',
        apiSecret: process.env.WECHAT_API_SECRET || '',
      });

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // 处理支付成功的逻辑
      const paymentResult: any = pay.decipher_gcm(body.resource.ciphertext,body.resource.associated_data,body.resource.nonce,process.env.WECHAT_API_SECRET || undefined);
      console.log('支付成功:', paymentResult);
      const PaymentOrderNumber = paymentResult.out_trade_no;

      // 更新支付记录和订单状态
      await db.transaction(async (trx) => {
        // 更新支付记录状态
        const payment = await trx('payments')
          .where({ payment_no: PaymentOrderNumber })
          .first();
        
        if (!payment) {
          throw new Error('支付记录不存在');
        }

        // 更新支付记录，移除 paid_at 字段
        await trx('payments')
          .where({ payment_no: PaymentOrderNumber })
          .update({
            status: 1, // 支付成功
            transaction_id: paymentResult.transaction_id
          });

        // 更新订单状态，检查 orders 表是否有 paid_at 字段
        await trx('orders')
          .where({ id: payment.order_id })
          .update({
            status: 1 // 已支付
            // 如果 orders 表也没有 paid_at 字段，请移除下面这行
            // paid_at: new Date()
          });
      });

      // 返回成功响应给微信支付平台
      res.status(200).json({ status: 'SUCCESS' });
    } catch (error) {
      console.error('处理支付通知失败:', error);
      // 返回错误响应给微信支付平台
      res.status(200).json({ status: 'FAIL' });
    }
  } else {
    // 如果不是 POST 请求，则返回方法不允许的响应
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method Not Allowed`);
  }
}
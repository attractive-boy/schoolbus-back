import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;
  
  try {
    const filePath = path.join(process.cwd(), 'uploads', filename as string);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 获取文件
    const fileBuffer = fs.readFileSync(filePath);
    
    // 对文件名进行编码，避免特殊字符问题
    const safeFilename = encodeURIComponent(filename as string);
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${safeFilename}`
    );
    
    // 发送文件
    res.send(fileBuffer);
  } catch (error) {
    console.error('文件处理错误:', error);
    res.status(500).json({ error: '文件处理失败' });
  }
} 
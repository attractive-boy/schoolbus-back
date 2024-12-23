// pages/api/upload.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';

// 禁用 Next.js 默认的 body 解析
export const config = {
  api: {
    bodyParser: false,
  },
};

// 辅助函数：用于解析上传的文件
const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files; }> => {
    const form = formidable();
    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });
  };

// 上传文件处理函数
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // 解析文件
      const { files } = await parseForm(req);
      console.log('文件信息:', files);
      const file:any = files.file;

      if (!file) {
        return res.status(400).json({ error: '没有上传文件' });
      }

      // 创建上传目录
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // 生成新的文件名
      const fileExtension = file[0].originalFilename.split('.').pop();
      const timestamp = Date.now();
      const newFileName = `${timestamp}-${file[0].originalFilename}`;
      const filePath = path.join(uploadDir, newFileName);

      // 复制文件到目标位置
      await fs.promises.copyFile(file[0].filepath, filePath);

      // 删除临时文件
      await fs.promises.unlink(file[0].filepath);

      // 生成访问 API 路径
      const accessPath = `/api/file/${newFileName}`;

      // 响应成功，返回访问路径
      return res.status(200).json({ 
        message: '文件上传成功！', 
        url: accessPath,
        filename: newFileName,
        originalName: file[0].originalFilename
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: '上传文件时出错' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `不允许的方法 ${req.method}` });
  }
}

// pages/api/upload.ts

import { put } from '@vercel/blob';
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

// 保持 bodyParser 禁用，因为我们需要处理文件上传
export const config = {
  api: {
    bodyParser: false,
  },
};

// 保留解析表单的辅助函数
const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files; }> => {
  const form = formidable();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `不允许的方法 ${req.method}` });
  }

  try {
    // 解析上传的文件
    const { files } = await parseForm(req);
    const file: any = files.file;

    if (!file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    // 读取文件内容
    const fileContent = await require('fs').promises.readFile(file[0].filepath);
    
    // 生成新的文件名
    const timestamp = Date.now();
    const newFileName = `${timestamp}-${file[0].originalFilename}`;

    // 上传到 Vercel Blob
    const { url } = await put(newFileName, fileContent, {
      access: 'public',
      contentType: file[0].mimetype
    });

    // 删除临时文件
    await require('fs').promises.unlink(file[0].filepath);

    // 返回结果
    return res.status(200).json({ 
      message: '文件上传成功！',
      url: url,  // 使用 Vercel Blob 返回的 URL
      filename: newFileName,
      originalName: file[0].originalFilename
    });

  } catch (error) {
    console.error('上传错误:', error);
    return res.status(500).json({ error: '文件上传失败' });
  }
}

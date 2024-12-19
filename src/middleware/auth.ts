import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export default function auth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: '未授权访问' });
      }

      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ message: '认证失败' });
    }
  };
} 
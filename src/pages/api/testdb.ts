import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/mongodb';

type ResponseData = {
  success: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    await dbConnect();
    res.status(200).json({ success: true, message: 'Database connected' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src/lib/content-v2.json');
  const file = fs.readFileSync(filePath, 'utf-8');
  return new NextResponse(file, {
    headers: {
      'Content-Disposition': 'attachment; filename="content-config.json"',
      'Content-Type': 'application/json'
    }
  });
}

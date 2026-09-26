import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const contentPath = path.join(process.cwd(), 'src/lib/content-v2.json');

export async function GET() {
  try {
    const data = fs.readFileSync(contentPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const data = fs.readFileSync(contentPath, 'utf8');
    const content = JSON.parse(data);

    // simple dot notation write
    const keys = key.split('.');
    let current = content;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
    return NextResponse.json({ success: true, content });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to write content' }, { status: 500 });
  }
}

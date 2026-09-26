import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/quizzes')) {
    if (process.env.NEXT_PUBLIC_FEATURE_QUIZZES !== 'true') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }
  return NextResponse.next();
}
export const config = { matcher: ['/quizzes/:path*'] };
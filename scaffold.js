const fs = require('fs');
const path = require('path');

const dirs = [
  'src/config',
  'src/hooks',
  'src/services/contracts',
  'src/services/mocks',
  'src/components/layout',
  'src/components/ui',
  'src/components/shared',
  'src/app/api/admin/content',
  'src/app/classes',
  'src/app/meetings',
  'src/app/assignments',
  'src/app/quizzes',
  'src/app/analytics'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const featuresTs = `export const FEATURES = {
  quizzes: process.env.NEXT_PUBLIC_FEATURE_QUIZZES === 'true',
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
};`;
fs.writeFileSync(path.join(__dirname, 'src/config/features.ts'), featuresTs);

const envLocal = `NEXT_PUBLIC_FEATURE_QUIZZES=false
NEXT_PUBLIC_USE_MOCK=true`;
fs.writeFileSync(path.join(__dirname, '.env.local'), envLocal);

const middlewareTs = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/quizzes')) {
    if (process.env.NEXT_PUBLIC_FEATURE_QUIZZES !== 'true') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }
  return NextResponse.next();
}
export const config = { matcher: ['/quizzes/:path*'] };`;
fs.writeFileSync(path.join(__dirname, 'src/middleware.ts'), middlewareTs);

const layoutTsx = `import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={\`\${inter.className} bg-slate-50 text-slate-900 min-h-screen flex\`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <TopBar />
          <main className="p-8 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}`;
fs.writeFileSync(path.join(__dirname, 'src/app/layout.tsx'), layoutTsx);

const sidebarTsx = `import Link from 'next/link';
export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 p-4 shadow-sm">
      <div className="text-xl font-bold mb-8 text-slate-800">LMS System</div>
      <nav className="flex flex-col gap-2 text-sm text-slate-600 font-medium">
        <Link href="/" className="px-3 py-2 hover:bg-slate-50 rounded-lg">Dashboard</Link>
        <Link href="/classes" className="px-3 py-2 hover:bg-slate-50 rounded-lg">Classes</Link>
        <Link href="/quizzes" className="px-3 py-2 hover:bg-slate-50 rounded-lg">Quizzes</Link>
      </nav>
    </div>
  );
}`;
fs.writeFileSync(path.join(__dirname, 'src/components/layout/Sidebar.tsx'), sidebarTsx);

const topbarTsx = `export default function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10 shadow-sm">
      <div className="text-sm font-medium text-slate-500">Home / Dashboard</div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
      </div>
    </header>
  );
}`;
fs.writeFileSync(path.join(__dirname, 'src/components/layout/TopBar.tsx'), topbarTsx);

const pageTsx = `export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Welcome to LMS</h2>
        <p className="text-slate-600">The platform is running smoothly.</p>
      </div>
    </div>
  );
}`;
fs.writeFileSync(path.join(__dirname, 'src/app/page.tsx'), pageTsx);

console.log("Scaffold complete.");

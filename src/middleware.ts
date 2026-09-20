import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. If visiting login page, allow direct access so user can choose any role/demo account
  if (pathname === '/login') {
    return response;
  }

  // 2. Protected dashboard routes: require authenticated user
  const isDashboardRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/petugas') ||
    pathname.startsWith('/bendahara') ||
    pathname.startsWith('/nasabah');

  if (isDashboardRoute) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);

      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto');
      if (forwardedHost) {
        const [cleanHostname, cleanPort] = forwardedHost.split(':');
        loginUrl.hostname = cleanHostname;
        loginUrl.port = cleanPort || '';
        loginUrl.protocol = forwardedProto ? `${forwardedProto}:` : 'https:';
      }

      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/petugas/:path*',
    '/bendahara/:path*',
    '/nasabah/:path*',
  ],
};

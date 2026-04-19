import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
    const token = request.cookies.get('session_token')?.value;
    console.log('Proxy middleware invoked for:', request.url, 'Token:', token ? '[REDACTED]' : 'None');
    const { pathname } = request.nextUrl;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isPublicFile = pathname.includes('.');

    const redirectToLogin = () => {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session_token');
        return response;
    };

    if (!token && !isAuthPage && !isPublicFile) {
        return redirectToLogin();
    }

    if (token && !isAuthPage && !isPublicFile) {
        try {
            const trimmedToken = token.trim();
            const bearerToken = trimmedToken.startsWith('Bearer ') ? trimmedToken : `Bearer ${trimmedToken}`;
            const rawToken = trimmedToken.startsWith('Bearer ') ? trimmedToken.slice(7).trim() : trimmedToken;

            const attemptHeaders = [
                new Headers({ Authorization: bearerToken }),
                new Headers({ Authorization: rawToken }),
                new Headers({ Cookie: `session_token=${encodeURIComponent(rawToken)}` }),
            ];

            let validated = false;
            let unauthorized = false;

            for (const headers of attemptHeaders) {
                const validateResponse = await fetch(process.env.API_URL + '/validate', {
                    headers: headers as HeadersInit,
                    cache: 'no-store',
                });

                if (validateResponse.ok) {
                    validated = true;
                    break;
                }

                if (validateResponse.status === 401) {
                    unauthorized = true;
                }
            }

            if (!validated && unauthorized) {
                return redirectToLogin();
            }
        } catch {
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
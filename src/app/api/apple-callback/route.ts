import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get('code');
    const id_token = formData.get('id_token');
    const state = formData.get('state');
    const user = formData.get('user');

    // This HTML will be rendered inside the Apple popup window.
    // It sends the data back to the main application window and then closes itself.
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Apple Sign In Callback</title>
</head>
<body>
    <script>
        const response = {
            authorization: {
                code: ${code ? `'${code}'` : 'null'},
                id_token: ${id_token ? `'${id_token}'` : 'null'},
                state: ${state ? `'${state}'` : 'null'}
            },
            user: ${user ? (typeof user === 'string' ? user : JSON.stringify(user)) : 'null'}
        };
        
        if (window.opener) {
            // Post message back to the parent window (SignInModal)
            window.opener.postMessage(response, window.location.origin);
            window.close();
        } else {
            // Fallback for non-popup flows
            window.location.href = '/?apple_auth_success=true';
        }
    </script>
    <div style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
        <p>Completing your sign-in...</p>
    </div>
</body>
</html>
`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Apple callback error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Support GET for health checks or debugging
export async function GET() {
  return new NextResponse('Apple Callback Endpoint Active. Use POST from Apple.', { status: 200 });
}

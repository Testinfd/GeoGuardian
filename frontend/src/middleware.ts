import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => true // Allow all access - authentication is now optional
    },
  }
)

export const config = {
  matcher: [
    // Remove middleware protection to allow anonymous access
    // '/dashboard/:path*',
    // '/api/v1/:path*'
  ]
}

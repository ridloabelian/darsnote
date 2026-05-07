import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/masuk",
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};

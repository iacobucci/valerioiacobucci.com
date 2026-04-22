import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction && process.env.AUTH_URL_DEV) {
  process.env.AUTH_URL = process.env.AUTH_URL_DEV;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: isProduction ? process.env.AUTH_GITHUB_ID : (process.env.AUTH_GITHUB_ID_DEV || process.env.AUTH_GITHUB_ID),
      clientSecret: isProduction ? process.env.AUTH_GITHUB_SECRET : (process.env.AUTH_GITHUB_SECRET_DEV || process.env.AUTH_GITHUB_SECRET),
    }),
  ],
  trustHost: true,
})

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
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        }
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token?.username) {
        (session.user as any).username = token.username;
      }
      if (token?.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
    jwt({ token, profile }) {
      if (profile) {
        token.username = profile.login;
        token.id = profile.id?.toString();
      }
      return token;
    },
  },
  trustHost: true,
})

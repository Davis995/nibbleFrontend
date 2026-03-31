import NextAuth, { type NextAuthOptions, type Session, type Account } from "next-auth"
import type { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account }: { token: JWT; account?: Account | null }) {
      // Store the Google ID token on the JWT so it can be passed to your backend
      if (account?.id_token) {
        ;(token as any).id_token = account.id_token
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Attach the id_token to the session object for client-side access
      return {
        ...session,
        id_token: (token as any).id_token,
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

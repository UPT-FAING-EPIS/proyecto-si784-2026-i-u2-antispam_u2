import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { BACKEND_API_URL } from "./env";

type BackendUser = {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        try {
          const loginRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!loginRes.ok) return null;

          const loginData = (await loginRes.json()) as LoginResponse;

          const meRes = await fetch(`${BACKEND_API_URL}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${loginData.access_token}` },
          });
          if (!meRes.ok) return null;
          const user = (await meRes.json()) as BackendUser;

          return {
            id: String(user.id),
            email: user.email,
            name: user.username,
            username: user.username,
            isAdmin: user.is_admin,
            accessToken: loginData.access_token,
          };
        } catch {
          clearTimeout(timeout);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as unknown as Record<string, unknown>).username;
        token.isAdmin = (user as unknown as Record<string, unknown>).isAdmin;
        token.accessToken = (user as unknown as Record<string, unknown>).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      (session as unknown as Record<string, unknown>).accessToken = token.accessToken;
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = token.id as string;
        u.username = token.username;
        u.isAdmin = token.isAdmin;
      }
      return session;
    },
  },
};

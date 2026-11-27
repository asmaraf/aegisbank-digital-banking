import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (user.status === "BLOCKED") {
          throw new Error("Your account has been blocked. Contact support.");
        }

        if (user.status === "INACTIVE") {
          throw new Error("Your account is inactive. Contact bank staff.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(
  allowedRoles?: Role[],
  checkLiveStatus = false
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  if (session.user.status !== "ACTIVE") {
    return {
      error: NextResponse.json({ error: "Account is inactive or blocked" }, { status: 403 }),
      session: null,
    };
  }

  if (checkLiveStatus) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, status: true, name: true, email: true },
    });

    if (!dbUser || dbUser.status !== "ACTIVE") {
      return {
        error: NextResponse.json({ error: "Account is inactive or blocked" }, { status: 403 }),
        session: null,
      };
    }

    if (allowedRoles && !allowedRoles.includes(dbUser.role)) {
      return {
        error: NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 }),
        session: null,
      };
    }

    return {
      error: null,
      session: {
        ...session,
        user: {
          ...session.user,
          id: dbUser.id,
          role: dbUser.role,
          status: dbUser.status,
          name: dbUser.name,
          email: dbUser.email,
        },
      },
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}

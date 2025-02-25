import NextAuth, { type DefaultSession,} from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { getSqlClient } from "@/app/lib/data";
import { User } from "@/app/lib/definitions";
import bcrypt from 'bcrypt';

declare module "next-auth" {
  interface Session {
    user: {
      isAdmin: boolean;
      email: string;
    } & DefaultSession['user']
  }

}

export async function getUser(email: string): Promise<User | null> {
    const client = await getSqlClient();
    try {
        const user = await client.sql<User>`SELECT * FROM users WHERE email = ${email}`;
        return user.rows[0] ?? null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch user data.");
    } finally {
        client.end();
    }
}
const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [Credentials({
        async authorize(credentials) {
            const parsedCredentials = z.object({
                email: z.string({
                    message: 'Invalid username',
                    invalid_type_error: 'Invalid username type',
                }).email({
                    message: 'Invalid email address',
                }),
                password: z.string().min(6, {
                    message: 'Password must be at least 6 characters',
                }),
                isAdmin: z.boolean().optional()
            }).safeParse(credentials)
            if (parsedCredentials.success) {
                const { email, password } = parsedCredentials.data;
                const user = await getUser(email);
                if (!user) {
                    return null;
                }
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (passwordMatch) {
                    return user;
                }
            }
            return null;

        }
    })],
});


export { handlers, signOut, signIn, auth }
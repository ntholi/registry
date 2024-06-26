import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';
import prisma from '@/lib/prisma';

const scopes = [
  'email',
  'openid',
  'profile',
  'https://www.googleapis.com/auth/drive',
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',

          scope: scopes.join(' '),
        },
      },
    }),
  ],
  secret: process.env.JWT_SECRET,
  callbacks: {
    async signIn({ user: { email, name } }) {
      if (!email) {
        console.error('No email found in user object');
        return false;
      }
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        await prisma.user.create({
          data: {
            email: email,
            name: name,
          },
        });
      }
      return true;
    },
    async jwt({ token, account }: any) {
      if (token) {
        if (token.email) {
          const user = await prisma.user.findFirst({
            where: { email: token.email },
          });
          token.id = user?.id;
        }
      }
      if (account) {
        token = Object.assign({}, token, {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000,
        });
      } else if (Date.now() > token.accessTokenExpires) {
        // accessToken has expired, try to refresh it
        const refreshTokenResponse = await refreshAccessToken(
          token.refreshToken
        );
        if (refreshTokenResponse.access_token) {
          token = Object.assign({}, token, {
            accessToken: refreshTokenResponse.access_token,
            refreshToken: refreshTokenResponse.refresh_token
              ? refreshTokenResponse.refresh_token
              : token.refreshToken, // new refresh token is only provided if the old one has expired
            accessTokenExpires:
              Date.now() + refreshTokenResponse.expires_in * 1000,
          });
        } else {
          console.log(
            'Failed to refresh access token: ' +
              JSON.stringify(refreshTokenResponse)
          );
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session) {
        session = Object.assign({}, session, {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          accessTokenExpires: token.accessTokenExpires,
        });
      }
      session.user.id = token.id;
      return session;
    },
  },
};

async function refreshAccessToken(refreshToken: any) {
  try {
    const { data } = await axios({
      method: 'post',
      url: 'https://oauth2.googleapis.com/token',
      params: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
    });

    return data;
  } catch (error: any) {
    console.log('Error refreshing access token: ', error.response.data);
    return error.response.data;
  }
}

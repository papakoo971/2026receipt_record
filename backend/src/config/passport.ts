import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { userModel } from '../models/database.js';

export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  profile_image: string | null;
  created_at: string;
}

declare global {
  namespace Express {
    interface User {
      id: number;
      google_id: string;
      email: string;
      name: string;
      profile_image: string | null;
      created_at: string;
    }
  }
}

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          // Check if user exists
          let user = userModel.findByGoogleId(profile.id) as User | undefined;

          if (!user) {
            // Create new user
            const email = profile.emails?.[0]?.value || '';
            const name = profile.displayName || '';
            const profileImage = profile.photos?.[0]?.value || null;

            const userId = userModel.create(profile.id, email, name, profileImage || undefined);
            user = userModel.findById(Number(userId)) as User;
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: number, done) => {
    try {
      const user = userModel.findById(id) as User | undefined;
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });
}

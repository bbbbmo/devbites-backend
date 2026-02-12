import * as admin from 'firebase-admin';
import { config as loadEnv } from 'dotenv';

// dotenv 타입이 좁게 지정되지 않아 no-unsafe-call 경고가 발생해 예외 처리
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
loadEnv({ path: '.env.local' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const firebaseAdmin = admin;

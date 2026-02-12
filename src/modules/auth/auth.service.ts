import { Injectable } from '@nestjs/common';
import { firebaseAdmin } from 'src/firebase-admin';

@Injectable()
export class FirebaseAuthService {
  async verifyIdToken(idToken: string) {
    return firebaseAdmin.auth().verifyIdToken(idToken);
  }
}

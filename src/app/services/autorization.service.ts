import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { httpsCallable } from 'firebase/functions';
import { from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  constructor(private firebaseService: FirebaseService) {}

  async _authorize(secretCode: string): Promise<any> {
    const functions = this.firebaseService.getFunctions();
    const checkSecretCode = httpsCallable(functions, 'checkSecretCode');
    return checkSecretCode({ text: secretCode });
  }

  authorize(secretCode: string) {
    return from(this._authorize(secretCode));
  }
}

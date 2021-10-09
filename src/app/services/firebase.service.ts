import { Injectable } from '@angular/core';
import {
  connectFirestoreEmulator,
  Firestore,
  getDocs,
  initializeFirestore,
} from 'firebase/firestore';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { collection } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from './db-models';

const firebaseConfig = {
  apiKey: 'AIzaSyD9RZ8BHR_3lHXI2SmCTbhBuj9CaslHVFY',
  authDomain: 'hubsson-parking.firebaseapp.com',
  projectId: 'hubsson-parking',
  storageBucket: 'hubsson-parking.appspot.com',
  messagingSenderId: '1061531745136',
  appId: '1:1061531745136:web:2d5a32fb2e7e1629ebedb5',
};
const USERS_COLLECTION = 'users';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly db: Firestore;

  constructor() {
    this.app = initializeApp(firebaseConfig);

    this.db = initializeFirestore(this.app, {});

    if (!environment.production) {
      connectFirestoreEmulator(this.db, 'localhost', 8080);
    }
  }

  private async _getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(this.db, USERS_COLLECTION));
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push(data as User);
    });
    return users;
  }

  getUsers(): Observable<User[]> {
    return from(this._getUsers());
  }
}

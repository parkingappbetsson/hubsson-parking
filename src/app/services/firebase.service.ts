import { Injectable } from '@angular/core';
import {
  CollectionReference,
  connectFirestoreEmulator,
  doc,
  DocumentData,
  Firestore,
  getDocs,
  initializeFirestore,
  query,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { collection } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Reservation, ReservationDTO, User } from './db-models';
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyB6rWaLwb8DsrYs7NMgZi0Avnqvun4k8UU',
  authDomain: 'hubsson-parking.firebaseapp.com',
  projectId: 'hubsson-parking',
  storageBucket: 'hubsson-parking.appspot.com',
  messagingSenderId: '1061531745136',
  appId: '1:1061531745136:web:dc6eb056860850f9ebedb5',
};
const USERS_COLLECTION = 'users';
const RESERVATIONS_COLLECTION = 'reservations';
const SECRET_CODE_COLLECTION = 'secret-code';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly db: Firestore;
  private readonly auth: Auth;

  constructor() {
    this.app = initializeApp(firebaseConfig);

    this.db = initializeFirestore(this.app, {});
    this.auth = getAuth();

    if (!environment.production) {
      connectFirestoreEmulator(this.db, 'localhost', 8080);
      connectAuthEmulator(this.auth, 'http://localhost:9099');
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

  private async _saveReservations(
    reservations: ReservationDTO[]
  ): Promise<void> {
    var batch = writeBatch(this.db);
    for (const reservation of reservations) {
      const newResercationDoc = doc(
        collection(this.db, RESERVATIONS_COLLECTION)
      );
      batch.set(newResercationDoc, reservation);
    }
    return batch.commit();
  }

  private async _getPreviousReservations(): Promise<Reservation[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = Timestamp.fromDate(today);
    const reservationCollestion = collection(this.db, RESERVATIONS_COLLECTION);
    const reservationsQuery = query(
      reservationCollestion,
      where('day', '>=', startDate)
    );
    const reservations: Reservation[] = [];
    const reservationsSnapshot = await getDocs(reservationsQuery);
    reservationsSnapshot.forEach((doc) => {
      const { day, userId, parkingSlot } = doc.data();
      reservations.push({
        userId,
        parkingSlot,
        day: (day as Timestamp).toDate(),
      });
    });
    return reservations;
  }

  private async _login(): Promise<boolean> {
    try {
      await signInAnonymously(this.auth);
      return true;
    } catch (error) {
      return false;
    }
  }

  getUsers$(): Observable<User[]> {
    return from(this._getUsers());
  }

  saveReservations$(reservations: ReservationDTO[]): Observable<void> {
    return from(this._saveReservations(reservations));
  }

  getPreviousReservations$(): Observable<Reservation[]> {
    return from(this._getPreviousReservations());
  }

  login$(): Observable<boolean> {
    return from(this._login());
  }

  getSecretCollection(): CollectionReference<DocumentData> {
    return collection(this.db, SECRET_CODE_COLLECTION);
  }
}

import { Injectable } from '@angular/core';
import {
  connectFirestoreEmulator,
  doc,
  Firestore,
  getDocs,
  initializeFirestore,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { collection } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Reservation, ReservationDTO, User } from './db-models';

const firebaseConfig = {
  apiKey: 'AIzaSyD9RZ8BHR_3lHXI2SmCTbhBuj9CaslHVFY',
  authDomain: 'hubsson-parking.firebaseapp.com',
  projectId: 'hubsson-parking',
  storageBucket: 'hubsson-parking.appspot.com',
  messagingSenderId: '1061531745136',
  appId: '1:1061531745136:web:2d5a32fb2e7e1629ebedb5',
};
const USERS_COLLECTION = 'users';
const RESERVATIONS_COLLECTION = 'reservations';

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

  getUsers$(): Observable<User[]> {
    return from(this._getUsers());
  }

  saveReservations$(reservations: ReservationDTO[]): Observable<void> {
    return from(this._saveReservations(reservations));
  }

  getPreviousReservations$(): Observable<Reservation[]> {
    return from(this._getPreviousReservations());
  }
}

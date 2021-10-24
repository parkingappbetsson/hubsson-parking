import { Injectable } from '@angular/core';
import {
	addDoc,
	CollectionReference,
	connectFirestoreEmulator,
	doc,
	DocumentData,
	Firestore,
	getDoc,
	getDocs,
	initializeFirestore,
	query,
	Timestamp,
	where,
	writeBatch,
} from 'firebase/firestore';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { collection } from 'firebase/firestore';
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Reservation, ReservationDTO, User } from './db-models';
import { Auth, connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';

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

	private users: User[];
	private users$: BehaviorSubject<User[] | undefined>;
	private reservations: Reservation[];
	private reservations$: BehaviorSubject<Reservation[] | undefined>;

	constructor() {
		this.app = initializeApp(firebaseConfig);

		this.db = initializeFirestore(this.app, {});
		this.auth = getAuth();

		if (!environment.production) {
			connectFirestoreEmulator(this.db, 'localhost', 8080);
			connectAuthEmulator(this.auth, 'http://localhost:9099');
		}
		this.users$ = new BehaviorSubject<User[] | undefined>(undefined);
		this.reservations$ = new BehaviorSubject<Reservation[] | undefined>(undefined);
		this.users = [];
		this.reservations = [];
	}

	private async _getUsers(): Promise<void> {
		const querySnapshot = await getDocs(collection(this.db, USERS_COLLECTION));
		const users: User[] = [];
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			users.push(data as User);
		});
		this.users = users;
		this.users$.next(this.users);
	}

	private async _saveUser(newUser: User): Promise<void> {
		addDoc(collection(this.db, USERS_COLLECTION), newUser);
		this.users.push(newUser);
		this.users$.next(this.users);
	}

	private async _saveReservations(newReservations: ReservationDTO[]): Promise<boolean> {
		var batch = writeBatch(this.db);
		const reservationCollection = collection(this.db, RESERVATIONS_COLLECTION);

		for (const newReservation of newReservations) {
			const updateIndex = this.reservations.findIndex(
				(oldReservation) =>
					oldReservation.day.getTime() === newReservation.day.toDate().getTime() &&
					oldReservation.userId === newReservation.userId
			);
			if (updateIndex !== -1) {
				const reservationQuery = query(
					reservationCollection,
					where('day', '==', newReservation.day),
					where('userId', '==', newReservation.userId)
				);
				const reservationDoc = await getDocs(reservationQuery);
				batch.update(reservationDoc.docs[0].ref, { parkingSlot: newReservation.parkingSlot });
				this.reservations[updateIndex].parkingSlot = newReservation.parkingSlot;
				continue;
			}
			const newResercationDoc = doc(reservationCollection);
			batch.set(newResercationDoc, newReservation);
		}
		await batch.commit();

		newReservations.forEach((reservation) => {
			const { day, userId, parkingSlot } = reservation;
			this.reservations.push({
				userId,
				parkingSlot,
				day: (day as Timestamp).toDate(),
			});
		});
		this.reservations$.next(this.reservations);

		return true;
	}

	private async _getPreviousReservations(): Promise<void> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const startDate = Timestamp.fromDate(today);
		const reservationCollection = collection(this.db, RESERVATIONS_COLLECTION);
		const reservationsQuery = query(reservationCollection, where('day', '>=', startDate));
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
		this.reservations = reservations;
		this.reservations$.next(reservations);
	}

	private async _login(): Promise<boolean> {
		try {
			await signInAnonymously(this.auth);
			return true;
		} catch (error) {
			return false;
		}
	}

	getUsers$(): Observable<User[] | undefined> {
		this._getUsers();
		return this.users$.asObservable();
	}

	saveUser$(newUser: User): Observable<void> {
		return from(this._saveUser(newUser));
	}

	saveReservations$(reservations: ReservationDTO[]): Observable<boolean> {
		return from(this._saveReservations(reservations));
	}

	getPreviousReservations$(): Observable<Reservation[] | undefined> {
		this._getPreviousReservations();
		return this.reservations$.asObservable();
	}

	login$(): Observable<boolean> {
		return from(this._login());
	}

	getSecretCollection(): CollectionReference<DocumentData> {
		return collection(this.db, SECRET_CODE_COLLECTION);
	}
}

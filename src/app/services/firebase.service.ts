import { Injectable } from '@angular/core';
import {
	addDoc,
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
import { BehaviorSubject, from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Reservation, ReservationDTO, User } from './db-models';
import { Auth, connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCQCFVIOq_A4vUWSdeuHZnrQe0Qo6xbc6M",
  authDomain: "hubsson-parking-407ed.firebaseapp.com",
  projectId: "hubsson-parking-407ed",
  storageBucket: "hubsson-parking-407ed.appspot.com",
  messagingSenderId: "997921083566",
  appId: "1:997921083566:web:d00ce841a2e7c92d0e5d3f"
};
const USERS_COLLECTION = 'users';
const RESERVATIONS_COLLECTION = 'reservations';
const SECRET_CODE_COLLECTION = 'secret-code';
const SLACK_HOOK_COLLECTION = 'slack-hook';
const TWO_HOURS_IN_SECONDS = 2 * 60 * 60;

@Injectable({
	providedIn: 'root',
})
export class FirebaseService {
	private readonly app: FirebaseApp;
	private readonly db: Firestore;
	private readonly auth: Auth;
	private readonly storage: FirebaseStorage;

	private users$: BehaviorSubject<User[] | undefined> | undefined;
	private reservations: Reservation[];
	private reservations$: BehaviorSubject<Reservation[] | undefined>;

	constructor() {
		this.app = initializeApp(firebaseConfig);

		this.db = initializeFirestore(this.app, {});
		this.auth = getAuth();
		this.storage = getStorage();

		if (!environment.production) {
			connectFirestoreEmulator(this.db, '192.168.1.242', 8080);
			connectAuthEmulator(this.auth, 'http://192.168.1.242:9099');
			connectStorageEmulator(this.storage, '192.168.1.242', 9199);
		}

		this.reservations$ = new BehaviorSubject<Reservation[] | undefined>(undefined);
		this.reservations = [];
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

	private async _getUsersOnce(): Promise<void> {
		if (this.users$) {
			return;
		}
		this.users$ = new BehaviorSubject<User[] | undefined>(undefined);
		const users = await this._getUsers();
		this.users$.next(users);
	}

	private async _createUser(name: string, plate: string): Promise<User> {
		const users = await this._getUsers();
		const maxId = users?.reduce((accumulator, user) => Math.max(accumulator, Number(user.id)), 0) ?? 0;
		const newId = maxId + Math.floor(Math.random() * 3) + 1;
		const newUser: User = {
			name,
			plate,
			id: newId.toString(),
		};
		addDoc(collection(this.db, USERS_COLLECTION), newUser);
		users.push(newUser);
		if (!this.users$) {
			this.users$ = new BehaviorSubject<User[] | undefined>(users);
		} else {
			this.users$.next(users);
		}
		return newUser;
	}

	private async _saveReservations(reservationChanges: ReservationDTO[]): Promise<boolean> {
		var batch = writeBatch(this.db);
		const reservationCollection = collection(this.db, RESERVATIONS_COLLECTION);

		for (const reservationChange of reservationChanges) {
			const upperBoundaryDate = new Timestamp(reservationChange.day.seconds + TWO_HOURS_IN_SECONDS, 0);
			const lowerBoundaryDate = new Timestamp(reservationChange.day.seconds - TWO_HOURS_IN_SECONDS, 0);
			const updateIndex = this.reservations.findIndex(
				(oldReservation) =>
					oldReservation.day.getTime() <= upperBoundaryDate.toDate().getTime() &&
					oldReservation.day.getTime() >= lowerBoundaryDate.toDate().getTime() &&
					oldReservation.userId === reservationChange.userId
			);
			if (updateIndex !== -1) {
				// deletion needed
				const reservationQuery = query(
					reservationCollection,
					where('day', '<=', upperBoundaryDate),
					where('day', '>=', lowerBoundaryDate),
					where('userId', '==', reservationChange.userId)
				);
				const reservationDoc = await getDocs(reservationQuery);
				if (reservationChange.parkingSlot === this.reservations[updateIndex].parkingSlot) {
					batch.delete(reservationDoc.docs[0].ref);
					this.reservations.splice(updateIndex, 1);
				} else {
					batch.update(reservationDoc.docs[0].ref, { parkingSlot: reservationChange.parkingSlot });
					this.reservations[updateIndex].parkingSlot = reservationChange.parkingSlot;
				}
				continue;
			}
			const newResercationDoc = doc(reservationCollection);
			batch.set(newResercationDoc, reservationChange);
			const { day, userId, parkingSlot } = reservationChange;
			this.reservations.push({
				userId,
				parkingSlot,
        createdAt: new Date(),
				day: (day as Timestamp).toDate(),
			});
		}
		await batch.commit();
		this.reservations$.next([...this.reservations]);

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
			const { day, userId, createdAt, parkingSlot } = doc.data();
			reservations.push({
				userId,
				parkingSlot,
        createdAt,
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
		this._getUsersOnce();
		return this.users$!.asObservable();
	}

	createUser$(name: string, plate: string): Observable<User> {
		return from(this._createUser(name, plate));
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

	getSlackHookCollection(): CollectionReference<DocumentData> {
		return collection(this.db, SLACK_HOOK_COLLECTION);
	}

	getStorage(): FirebaseStorage {
		return this.storage;
	}
}

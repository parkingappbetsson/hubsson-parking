import { Injectable } from '@angular/core';
import {
	addDoc,
	CollectionReference,
	connectFirestoreEmulator,
	deleteDoc,
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

	private async _updateUsers(): Promise<void> {
		const users = await this._getUsers();
		this.users$.next(users);
	}

	private async _createUser(name: string, plate: string): Promise<User> {
		const users = await this._getUsers();
		const maxId = users?.reduce((accumulator, user) => Math.max(accumulator, Number(user.id)), 0) ?? 0;
		const newId = maxId + Math.floor(Math.random() * 3);
		const newUser: User = {
			name,
			plate,
			id: newId.toString(),
		};
		addDoc(collection(this.db, USERS_COLLECTION), newUser);
		users.push(newUser);
		this.users$.next(users);
		return newUser;
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

	private async _cancelReservation(reservationToCancel: ReservationDTO): Promise<void> {
		const reservationCollection = collection(this.db, RESERVATIONS_COLLECTION);
		const reservationQuery = query(
			reservationCollection,
			where('day', '==', reservationToCancel.day),
			where('userId', '==', reservationToCancel.userId)
		);
		const reservationDoc = await getDocs(reservationQuery);
		await deleteDoc(reservationDoc.docs[0].ref);

		const cancellationIndex = this.reservations.findIndex(
			(reservation) =>
				reservation.day.getDate() === reservationToCancel.day.toDate().getDate() &&
				reservation.userId === reservationToCancel.userId
		);
		this.reservations.splice(cancellationIndex, 1);
		this.reservations$.next([...this.reservations]);
	}

	getUsers$(): Observable<User[] | undefined> {
		this._updateUsers();
		return this.users$.asObservable();
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

	cancelReservation$(reservation: ReservationDTO): Observable<void> {
		return from(this._cancelReservation(reservation));
	}
}

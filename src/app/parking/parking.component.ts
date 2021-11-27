import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	OnDestroy,
	OnInit,
	ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';

import { Timestamp } from '@firebase/firestore';
import { merge, Subscription } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { SECRET_CODE_STORAGE_KEY, SELECTED_USER_STORAGE_KEY } from '../app.consts';
import { StorageService, StorageType } from '../services/storage.service';
import { ReservationDTO, User } from './../services/db-models';
import { FirebaseService } from './../services/firebase.service';

interface Day {
	date: Date;
	index: number;
}
type DayIndex = number;
type UserId = string;
type ParkingSlotId = string;
type ReservationDayDate = number;
type UserIdByParkingSlotId = Record<ParkingSlotId, UserId>;
const NUMBER_OF_DAYS = 10;

@Component({
	selector: 'hp-parking',
	templateUrl: './parking.component.html',
	styleUrls: ['./parking.component.scss'],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingComponent implements OnInit, OnDestroy {
	readonly parkingSlots = [
		{ name: 'Hubsson1', id: '0' },
		{ name: 'Hubsson2', id: '1' },
		{ name: 'Páva 908', id: '2' },
		{ name: 'Páva 909', id: '3' },
		{ name: 'Páva 912', id: '4' },
		{ name: 'Páva 913', id: '5' },
		{ name: 'Páva 914', id: '6' },
		{ name: 'Páva 915', id: '7' },
		{ name: 'Páva 917', id: '8' },
		{ name: 'Páva 924', id: '9' },
	];

	days: Day[] = Array(NUMBER_OF_DAYS).fill(0);
	chosenDayIndex = 0;
	selectedUser: User;

	@HostBinding('class.hp-parking') hostCss = true;

	private readonly msPerDay = 1000 * 60 * 60 * 24;
	private newReservations: Record<DayIndex, ParkingSlotId> = {};
	private previousReservations: Record<ReservationDayDate, UserIdByParkingSlotId | undefined> | undefined;
	private data$$: Subscription | undefined;
	private users: User[] | undefined;

	constructor(private firebaseService: FirebaseService, private cdRef: ChangeDetectorRef, private router: Router) {
		this.selectedUser = StorageService.getForKey(SELECTED_USER_STORAGE_KEY, StorageType.Local);
		if (!this.selectedUser) {
			this.router.navigate(['']);
		}
	}

	ngOnInit() {
		const today = new Date();
		today.setHours(5, 0, 0, 0);
		const todayTime = today.getTime();
		this.days = this.days.map((_, dayIndex: number) => {
			const timeForDayIndex = todayTime + dayIndex * this.msPerDay;
			return { date: new Date(timeForDayIndex), index: dayIndex };
		});

		const previousReservations$ = this.firebaseService.getPreviousReservations$().pipe(
			tap((previousReservations) => {
				this.previousReservations = [];
				previousReservations?.forEach((reservation) => {
					const reservationDay =
						this.previousReservations![reservation.day.getDate()] ?? ({} as UserIdByParkingSlotId);
					reservationDay[reservation.parkingSlot] = reservation.userId;
					this.previousReservations![reservation.day.getDate()] = reservationDay;
				});
			})
		);
		const users$ = this.firebaseService.getUsers$().pipe(
			filter((users) => !!users),
			take(1),
			tap((users) => (this.users = users))
		);

		this.data$$ = merge(previousReservations$, users$).subscribe(() => this.cdRef.markForCheck());
	}

	ngOnDestroy() {
		this.data$$?.unsubscribe();
	}

	chooseDay(dayIndex: number) {
		this.chosenDayIndex = dayIndex;
	}

	onTakeParkingSlot(event: Event, day: Day, parkingSlotId: string) {
		if (!(event.target as HTMLInputElement)?.checked) {
			return;
		}
		this.newReservations[day.index] = parkingSlotId;
	}

	cancelReservation(day: Day, parkingSlotId: string) {
		const reservation = {
			userId: this.selectedUser!.id,
			parkingSlot: parkingSlotId,
			day: Timestamp.fromDate(day.date),
		};
		this.firebaseService.cancelReservation$(reservation);
	}

	onSave() {
		const newReservations: ReservationDTO[] = Object.entries(this.newReservations).map(
			([dayIndex, parkingSlotId]) => ({
				userId: this.selectedUser!.id,
				parkingSlot: parkingSlotId,
				day: Timestamp.fromDate(this.days[+dayIndex].date),
			})
		);
		this.firebaseService.saveReservations$(newReservations);
		this.newReservations = {};
	}

	isSlotFree(date: Date, parkingSlotId: string): boolean {
		return !this.previousReservations?.[date.getDate()]?.[parkingSlotId];
	}

	private isSelectedUserTheReserver(date: Date, parkingSlotId: string): boolean {
		return this.previousReservations?.[date.getDate()]?.[parkingSlotId] === this.selectedUser.id;
	}

	isSlotCancellable(date: Date, parkingSlotId: string): boolean {
		return !this.isSlotFree(date, parkingSlotId) && this.isSelectedUserTheReserver(date, parkingSlotId);
	}

	getReserver(date: Date, parkingSlotId: string): string {
		const reserverId = this.previousReservations?.[date.getDate()]?.[parkingSlotId];
		if (!reserverId) {
			return '';
		}
		const reserver = this.users?.find((user) => user.id === reserverId);
		if (!reserver) {
			return '';
		}
		return `${reserver.name} ${reserver.plate}`;
	}

	isSaveDisabled(): boolean {
		return this.newReservations && Object.keys(this.newReservations).length === 0;
	}

	clearUser() {
		StorageService.remove(SELECTED_USER_STORAGE_KEY, StorageType.Local);
		StorageService.remove(SECRET_CODE_STORAGE_KEY, StorageType.Local);
		this.router.navigate(['']);
	}
}

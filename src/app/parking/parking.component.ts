import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	OnDestroy,
	OnInit,
	ViewEncapsulation,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { Timestamp } from '@firebase/firestore';
import { merge, Subscription } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { PREVIOUS_USER_STORAGE_KEY, SECRET_CODE_STORAGE_KEY, SELECTED_USER_STORAGE_KEY } from '../app.consts';
import { SlackService } from '../services/slack.service';
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
const NUMBER_OF_DAYS = 8;

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
	newReservationsCount = 0;

	@HostBinding('class.hp-parking') hostCss = true;

	private readonly msPerDay = 1000 * 60 * 60 * 24;
	private newReservations: Record<DayIndex, ParkingSlotId> = {};
	private previousReservations: Record<ReservationDayDate, UserIdByParkingSlotId | undefined> | undefined;
	private data$$: Subscription | undefined;
	private users: User[] | undefined;

	constructor(
		private firebaseService: FirebaseService,
		private cdRef: ChangeDetectorRef,
		private router: Router,
		private slackService: SlackService,
		private route: ActivatedRoute,
		sanitizer: DomSanitizer,
		iconRegistry: MatIconRegistry
	) {
		this.selectedUser = StorageService.getForKey(SELECTED_USER_STORAGE_KEY, StorageType.Local);
		if (!this.selectedUser) {
			this.router.navigate(['']);
		}
		iconRegistry.addSvgIcon(
			'address-card',
			sanitizer.bypassSecurityTrustResourceUrl('./assets/address-card-regular.svg')
		);
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
				for (let previousReservation of previousReservations ?? []) {
					const reservationDate = previousReservation.day.getDate();
					const parkingSlotsAndUsersReservingThem =
						this.previousReservations[reservationDate] ?? ({} as UserIdByParkingSlotId);
					parkingSlotsAndUsersReservingThem[previousReservation.parkingSlot] = previousReservation.userId;
					this.previousReservations![reservationDate] = parkingSlotsAndUsersReservingThem;
				}
			})
		);
		const users$ = this.firebaseService.getUsers$().pipe(
			filter((users) => !!users),
			take(1),
			tap((users) => (this.users = users))
		);

		const queryParams$ = this.route.queryParamMap.pipe(
			tap((params: ParamMap) => {
				const cancelledSlotId = params.get('cancel');
				const dayIndex = params.get('dayIndex');
				if (cancelledSlotId && dayIndex) {
					this.chooseDay(+dayIndex);
					this.cancelReservation(cancelledSlotId);
					this.onSave();
				}
			})
		);

		this.data$$ = merge(previousReservations$, users$, queryParams$).subscribe(() => this.cdRef.markForCheck());
	}

	ngOnDestroy() {
		this.data$$?.unsubscribe();
	}

	chooseDay(dayIndex: number) {
		this.chosenDayIndex = dayIndex;
	}

	takeParkingSlot(parkingSlotId: string) {
		if (this.newReservations[this.chosenDayIndex] === parkingSlotId) {
			delete this.newReservations[this.chosenDayIndex];
			this.newReservationsCount--;
			return;
		}
		this.newReservations[this.chosenDayIndex] = parkingSlotId;
		this.newReservationsCount = Object.keys(this.newReservations).length;
	}

	cancelReservation(parkingSlotId: string) {
		this.takeParkingSlot(parkingSlotId);
	}

	onSave() {
		const newReservationEntries = Object.entries(this.newReservations);
		const newReservations: ReservationDTO[] = newReservationEntries.map(([dayIndex, parkingSlotId]) => ({
			userId: this.selectedUser!.id,
			parkingSlot: parkingSlotId,
      createdAt: new Date(),
			day: Timestamp.fromDate(this.days[+dayIndex].date),
		}));
		// send slack notification if a slot is cancelled today or tomorrow
		for (const [dayIndex, parkingSlotId] of newReservationEntries.filter(([dIndex]) => +dIndex < 2)) {
			const prevReservationOnSlot =
				this.previousReservations?.[this.days[+dayIndex].date.getDate()]?.[parkingSlotId];
			if (!prevReservationOnSlot) {
				continue;
			}
			const slotName = this.parkingSlots.find((slot) => slot.id === parkingSlotId)!.name;
			const cancelledDay = this.days.find((day) => day.index === +dayIndex)!.date;
			this.slackService.slotCancelled(slotName, cancelledDay);
		}
		this.firebaseService.saveReservations$(newReservations);
		this.newReservations = {};
		this.newReservationsCount = 0;
	}

	isSlotFree(parkingSlotId: string): boolean {
		return !this.getReserver(parkingSlotId);
	}

	isSlotCancellable(parkingSlotId: string): boolean {
		return !this.isSlotFree(parkingSlotId) && this.isSelectedUserTheReserver(parkingSlotId);
	}

	isSlotPending(parkingSlotId: string): boolean {
		return this.newReservations[this.chosenDayIndex] === parkingSlotId;
	}

	isDayCancellable(day: Day): boolean {
		const userIdsForParkingSlotIdsOnDay = this.previousReservations?.[day.date.getDate()] ?? {};
		return Object.entries(userIdsForParkingSlotIdsOnDay).some(([, userId]) => userId === this.selectedUser.id);
	}

	getReserverText(parkingSlotId: string): string {
		const reserver = this.getReserver(parkingSlotId);
		if (!reserver) {
			return '';
		}
		return `${reserver.name} ${reserver.plate}`;
	}

	isSaveDisabled(): boolean {
		return this.newReservationsCount === 0;
	}

	clearUser() {
		StorageService.remove(SELECTED_USER_STORAGE_KEY, StorageType.Local);
		StorageService.remove(SECRET_CODE_STORAGE_KEY, StorageType.Local);
		StorageService.setForKey(PREVIOUS_USER_STORAGE_KEY, this.selectedUser, StorageType.Local);
		this.router.navigate(['']);
	}

	getFreeSlotNumberForDay(day: Day): number {
		return this.parkingSlots.length - Object.keys(this.previousReservations?.[day.date.getDate()] ?? {}).length;
	}

	openBadge(event: MouseEvent, parkingSlotId: string) {
		event.preventDefault();
		event.stopPropagation();
		this.router.navigate([parkingSlotId], {
			relativeTo: this.route,
			queryParams: { dayIndex: this.chosenDayIndex },
		});
	}

	private isSelectedUserTheReserver(parkingSlotId: string): boolean {
		return this.getReserverId(parkingSlotId) === this.selectedUser.id;
	}

	private getReserver(parkingSlotId: string): User | undefined {
		const reserverId = this.getReserverId(parkingSlotId);
		if (!reserverId) {
			return undefined;
		}
		const reserver = this.users?.find((user) => user.id === reserverId);
		return reserver;
	}

	private getReserverId(parkingSlotId: string): string | undefined {
		return this.previousReservations?.[this.days[this.chosenDayIndex].date.getDate()]?.[parkingSlotId];
	}
}

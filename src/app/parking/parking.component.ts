import {
  ChangeDetectorRef,
  Component,
  HostBinding,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

import { Timestamp } from '@firebase/firestore';
import { merge, Subscription } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { Reservation, ReservationDTO, User } from './../services/db-models';
import { FirebaseService } from './../services/firebase.service';

interface Day {
  date: Date;
  index: number;
}
type DayIndex = number;

@Component({
  selector: 'hp-parking',
  templateUrl: './parking.component.html',
  styleUrls: ['./parking.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ParkingComponent implements OnInit, OnDestroy {
  readonly parkingSlots = [
    { name: 'Hubsson1', id: '0' },
    { name: 'Hubsson2', id: '1' },
    { name: 'Páva1', id: '2' },
    { name: 'Páva2', id: '3' },
    { name: 'Páva3', id: '4' },
    { name: 'Páva4', id: '5' },
    { name: 'Páva5', id: '6' },
    { name: 'Páva6', id: '7' },
    { name: 'Páva7', id: '8' },
    { name: 'Páva8', id: '9' },
    { name: 'Páva9', id: '10' },
    { name: 'Páva10', id: '11' },
  ];

  days: Day[] = Array(10).fill(0);
  selectedUserId = 'default';
  users: User[] | undefined;

  @HostBinding('class.hp-parking') hostCss = true;

  private readonly msPerDay = 1000 * 60 * 60 * 24;
  private newReservations: Record<DayIndex, number> = {};
  private previousReservations: Reservation[] | undefined;
  private data$$: Subscription | undefined;

  constructor(
    private firebaseService: FirebaseService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const todayTime = new Date().getTime();
    this.days = this.days.map((_, dayIndex: number) => {
      const timeForDayIndex = todayTime + dayIndex * this.msPerDay;
      return { date: new Date(timeForDayIndex), index: dayIndex };
    });

    const auth$ = this.firebaseService.login$().pipe(
      filter((val) => {
        return val === true;
      })
    );

    const users$ = auth$.pipe(
      switchMap(() => this.firebaseService.getUsers$()),
      tap((users) => (this.users = users))
    );
    const previousReservations$ = auth$.pipe(
      switchMap(() => this.firebaseService.getPreviousReservations$()),
      tap((previousReservations) => {
        this.previousReservations = previousReservations;
      })
    );
    this.data$$ = merge(users$, previousReservations$).subscribe(() =>
      this.cdRef.markForCheck()
    );
  }

  ngOnDestroy() {
    this.data$$?.unsubscribe();
  }

  changeTakeParkingSlot(event: Event, day: Day, parkingSlot: number) {
    if (!(event.target as HTMLInputElement)?.checked) {
      return;
    }
    this.newReservations[day.index] = parkingSlot;
  }

  onSave() {
    const newReservations: ReservationDTO[] = Object.entries(
      this.newReservations
    ).map(([dayIndex, parkingSlot]) => ({
      userId: this.selectedUserId,
      parkingSlot: parkingSlot.toString(),
      day: Timestamp.fromDate(this.days[+dayIndex].date),
    }));
    this.firebaseService.saveReservations$(newReservations);
  }

  // TODO: use a map instead, it's called a lot
  isSlotFree(date: Date, parkingSlotId: string): boolean {
    return !this.previousReservations?.some(
      (previousReservation) =>
        previousReservation.parkingSlot === parkingSlotId &&
        previousReservation.day.getDate() === date.getDate()
    );
  }

  getReserver(date: Date, parkingSlotId: string): string {
    const reservation = this.previousReservations?.find(
      (previousReservation) =>
        previousReservation.parkingSlot === parkingSlotId &&
        previousReservation.day.getDate() === date.getDate()
    );
    if (!reservation) {
      return '';
    }
    const reserver = this.users?.find((user) => user.id === reservation.userId);
    if (!reserver) {
      return '';
    }
    return `${reserver.name} ${reserver.plate}`;
  }
}

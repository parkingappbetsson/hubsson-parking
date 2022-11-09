import { Timestamp } from '@firebase/firestore';

export interface User {
	id: string;
	name: string;
	plate: string;
}

export interface Reservation extends ReservationBase {
	day: Date;
}

export interface ReservationBase {
	userId: string;
	parkingSlot: string;
  createdAt: Date;
}

export interface ReservationDTO extends ReservationBase {
	day: Timestamp;
}

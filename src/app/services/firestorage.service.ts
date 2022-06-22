import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { ref, getDownloadURL } from 'firebase/storage';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FireStorageService {
	constructor(private firebaseService: FirebaseService) {}

	getUrlForParkingSlotId(parkingSlotId: string): Observable<string> {
		return from(getDownloadURL(ref(this.firebaseService.getStorage(), parkingSlotId)));
	}
}

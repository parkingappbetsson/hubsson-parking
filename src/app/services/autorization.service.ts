import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { from } from 'rxjs';
import { where, query, getDocs } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
	constructor(private firebaseService: FirebaseService) {}

	async _authorize(secretCode: string): Promise<any> {
		const secretCodeCollection = this.firebaseService.getSecretCollection();
		const secretCodeQuery = query(secretCodeCollection, where('secretCode', '==', secretCode));
		const reservationsSnapshot = await getDocs(secretCodeQuery);
		return !reservationsSnapshot.empty;
	}

	authorize(secretCode: string) {
		return from(this._authorize(secretCode));
	}
}

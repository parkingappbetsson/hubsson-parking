import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { getDocs } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class SlackService {
	#slackHookUrl: string | undefined;
	#slackLogUrl: string | undefined;

	constructor(private http: HttpClient, @Inject(LOCALE_ID) private locale: string, fbService: FirebaseService) {
		getDocs(fbService.getSlackHookCollection()).then((docs) =>
			docs.forEach((doc) => {
				const { url, logUrl } = doc.data();
				this.#slackHookUrl = url;
				this.#slackLogUrl = logUrl;
			})
		);
	}

	slotCancelled(slotName: string, date: Date) {
		const dateString = formatDate(date, 'EEEE, MM.d', this.locale);
		const body = { text: `Reservation of ${slotName} has been cancelled for ${dateString}` };
		this.http.post(this.#slackHookUrl!, JSON.stringify(body)).subscribe(
			(res) => {
				console.log(res);
				console.log('res received');
			},
			(err) => { }
		);
	}

	hubsson1or2Booked(slotName: string) {
		const today = new Date();
		const dateString = formatDate(today, 'EEEE, MM.d HH:MM:SS', this.locale);
		const body = { text: `${slotName} has been booked at ${dateString}` };
		this.http.post(this.#slackLogUrl!, JSON.stringify(body)).subscribe(
			(res) => {
				console.log(res);
				console.log('res received');
			},
			(err) => { }
		);
	}
}

import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { getDocs } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { IBotDetectionResult } from '../global/global.interfaces';

const slackLogURl = 'https://hooks.slack.com/services/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';

@Injectable({ providedIn: 'root' })
export class SlackService {
	#slackHookUrl: string | undefined;

	constructor(private http: HttpClient, @Inject(LOCALE_ID) private locale: string, fbService: FirebaseService) {
		getDocs(fbService.getSlackHookCollection()).then((docs) =>
			docs.forEach((doc) => {
				const { url } = doc.data();
				this.#slackHookUrl = url;
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
			(err) => {}
		);
	}

	hubsson1or2Booked(slotName: string, botDetails: IBotDetectionResult): void {
		const today = new Date();
		const dateString = formatDate(today, 'EEEE, MM.d HH:MM:SS', this.locale);
		const body = { text: `${slotName} has been booked at ${dateString}. ${botDetails.bot ? 
				`User has ussed a bot, type ${botDetails.botKind}`:
						botDetails.error ? 
						`There has been an error detecting the bot: ${botDetails.error}`: 
						"No bot has been used"}` };
		this.http.post(slackLogURl, JSON.stringify(body)).subscribe(
			(res) => {
				console.log(res);
				console.log('res received');
			},
			(err) => {}
		);
	}
}

import { Component, HostBinding, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { RECAPCHA, SECRET_CODE_STORAGE_KEY, SELECTED_USER_STORAGE_KEY } from '../app.consts';
import { StorageService, StorageType } from '../services/storage.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
	selector: 'hp-secret-code',
	templateUrl: './secret-code.component.html',
	styleUrls: ['./secret-code.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class SecretCodeComponent implements OnInit {
	@HostBinding('class.hp-secret-code') hostCss = true;
	secretCode: string | undefined;
	isRecaphaSolved: string | undefined;
	token: string | undefined;

	busy = true;

	constructor(
		private router: Router
	) { }

	ngOnInit() {
		const secretCode = StorageService.getForKey(SECRET_CODE_STORAGE_KEY, StorageType.Local);
		const selectedUser = StorageService.getForKey(SELECTED_USER_STORAGE_KEY, StorageType.Local);
		this.isRecaphaSolved = StorageService.getForKey(RECAPCHA, StorageType.Local);
		
		if (secretCode && selectedUser) {
			this.router.navigate(['parking']);
			return;
		}
		this.busy = false;
	}

	setSecretAndGo() {
		StorageService.setForKey(SECRET_CODE_STORAGE_KEY, this.secretCode, StorageType.Local);
		this.router.navigate(['choose-user']);
	}
}

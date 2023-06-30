import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, filter, map, withLatestFrom } from 'rxjs/operators';
import { SECRET_CODE_STORAGE_KEY } from '../app.consts';
import { AuthorizationService } from './autorization.service';
import { FirebaseService } from './firebase.service';
import { StorageService, StorageType } from './storage.service';

@Injectable({
	providedIn: 'root',
})
export class AuthorizationGuard implements CanActivate {
	constructor(
		private router: Router,
		private authorizationService: AuthorizationService,
		private firebaseService: FirebaseService
	) {}

	canActivate(): Observable<UrlTree | boolean> {
		// const secretCode = StorageService.getForKey(SECRET_CODE_STORAGE_KEY, StorageType.Local);
		// const fallback$ = of(this.router.parseUrl(''));
		// if (!secretCode) {
		// 	return fallback$;
		// }
		// return this.authorizationService.authorize(secretCode).pipe(
		// 	filter(Boolean),
		// 	withLatestFrom(this.firebaseService.login$()),
		// 	map(([, val]) => {
		// 		return val === true ? true : this.router.parseUrl('');
		// 	}),
		// 	catchError((err) => {
		// 		console.error(err);
		// 		return fallback$;
		// 	})
		// );
		return of(true);
	}
}

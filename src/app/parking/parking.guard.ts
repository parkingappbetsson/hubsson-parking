import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SECRET_CODE_KEY } from '../app.consts';
import { AuthorizationService } from '../services/autorization.service';
import { StorageService, StorageType } from '../services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class ParkingGuard implements CanActivate {
  constructor(
    private router: Router,
    private authorizationService: AuthorizationService
  ) {}

  canActivate(): Observable<UrlTree | boolean> {
    const secretCode = StorageService.getForKey(
      SECRET_CODE_KEY,
      StorageType.Local
    );
    const fallback$ = of(this.router.parseUrl(''));
    if (!secretCode) {
      return fallback$;
    }
    return this.authorizationService.authorize(secretCode).pipe(
      map((response) => !!response.data?.valid),
      catchError(() => {
        StorageService.remove(SECRET_CODE_KEY, StorageType.Local);
        return fallback$;
      })
    );
  }
}

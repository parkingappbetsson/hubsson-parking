import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SECRET_CODE_KEY } from '../app.consts';
import { StorageService, StorageType } from '../services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class ParkingGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): UrlTree | boolean {
    const secretCode = StorageService.getForKey(
      SECRET_CODE_KEY,
      StorageType.Local
    );
    // TODO: validate secretCode
    if (secretCode) {
      return true;
    }
    return this.router.parseUrl('');
  }
}

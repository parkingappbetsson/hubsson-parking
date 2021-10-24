import { Component, HostBinding, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService, StorageType } from './services/storage.service';
import { SECRET_CODE_STORAGE_KEY } from './app.consts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {}

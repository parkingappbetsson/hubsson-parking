import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { SECRET_CODE_KEY } from "../app.consts";
import { StorageService, StorageType } from "../services/storage.service";


@Component({
    selector: 'hp-secret-code',
    templateUrl: './secret-code.component.html',
    styleUrls: ['./secret-code.component.scss'],
    encapsulation: ViewEncapsulation.None,
  })
export class SecretCodeComponent implements OnInit {
    @HostBinding('class.hp-secret-code') hostCss = true;
    secretCode: string | undefined;

    constructor(private router: Router) {}

    ngOnInit() {
        const secretCode = StorageService.getForKey(SECRET_CODE_KEY, StorageType.Local);
        if(secretCode) {
            this.router.navigate(['parking']);
        }
    }
  
    setSecretAndGo() {
      StorageService.setForKey(
        SECRET_CODE_KEY,
        this.secretCode,
        StorageType.Local
      );
      this.router.navigate(['parking']);
    }
}
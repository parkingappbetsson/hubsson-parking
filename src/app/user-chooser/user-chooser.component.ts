import {
  ChangeDetectorRef,
  Component,
  HostBinding,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SELECTED_USER_STORAGE_KEY } from '../app.consts';
import { FirebaseService } from '../services/firebase.service';
import {
  StorageService,
  StorageType,
} from '../services/storage.service';
import { User } from './../services/db-models';

@Component({
  selector: 'hp-user-chooser',
  templateUrl: './user-chooser.component.html',
  styleUrls: ['./user-chooser.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UserChooserComponent implements OnInit, OnDestroy {
  @HostBinding('class.hp-user-chooser') hostCss = true;
  chosenUserId: string | undefined;
  users: User[] | undefined;
  name: string | undefined;
  plate: string | undefined;

  isCreatingNewUser = false;

  private users$$: Subscription | undefined;

  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.users$$ = this.firebaseService
      .getUsers$()
      .pipe(tap((users) => (this.users = users)))
      .subscribe(() => this.cdRef.markForCheck());
  }

  ngOnDestroy() {
    this.users$$?.unsubscribe();
  }

  selectUserAndGo() {
    let user: User;
    if (this.isCreatingNewUser) {
      user = this.createUser();
      this.saveNewUser(user);
    } else {
      user = this.users!.find((user) => user.id === this.chosenUserId)!;
    }
    StorageService.setForKey(
      SELECTED_USER_STORAGE_KEY,
      user,
      StorageType.Local
    );
    this.router.navigate(['parking']);
  }

  switchToCreate() {
    this.isCreatingNewUser = true;
  }

  private createUser(): User {
    let maxId =
      this.users?.reduce(
        (accumulator, user) => Math.max(accumulator, Number(user.id)),
        0
      ) ?? 0;
    const newUser: User = {
      name: this.name!,
      plate: this.plate!,
      id: (++maxId).toString(),
    };
    return newUser;
  }

  private saveNewUser(user: User) {
    // TODO
  }
}

import {
	ChangeDetectionStrategy,
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
import { StorageService, StorageType } from '../services/storage.service';
import { User } from './../services/db-models';

@Component({
	selector: 'hp-user-chooser',
	templateUrl: './user-chooser.component.html',
	styleUrls: ['./user-chooser.component.scss'],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserChooserComponent implements OnInit, OnDestroy {
	@HostBinding('class.hp-user-chooser') hostCss = true;
	selectedUserId: string | undefined;
	users: User[] | undefined;
	name: string | undefined;
	plate: string | undefined;

	isCreatingNewUser = false;

	private users$$: Subscription | undefined;

	constructor(private router: Router, private firebaseService: FirebaseService, private cdRef: ChangeDetectorRef) {}

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
		if (this.isCreatingNewUser) {
			this.firebaseService
				.createUser$(this.name!, this.plate!)
				.subscribe((user) => this.navigateToParkingWithUser(user));
			return;
		} else {
		}
		const user = this.users!.find((user) => user.id === this.selectedUserId)!;
		this.navigateToParkingWithUser(user);
	}

	switchToCreate() {
		this.isCreatingNewUser = true;
	}

	private navigateToParkingWithUser(user: User) {
		StorageService.setForKey(SELECTED_USER_STORAGE_KEY, user, StorageType.Local);
		this.router.navigate(['parking']);
	}
}

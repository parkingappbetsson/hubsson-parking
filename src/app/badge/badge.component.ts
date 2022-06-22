import { ChangeDetectionStrategy, Component, HostBinding, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { FireStorageService } from '../services/firestorage.service';

@Component({
	selector: 'hp-badge',
	templateUrl: './badge.component.html',
	styleUrls: ['./badge.component.scss'],
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent implements OnInit, OnDestroy {
	@HostBinding('class.hp-badge') hostCss = true;

	url$: Observable<string> | undefined;

	private parkingSlotId: string | undefined;
	private dayIndex: string | undefined | null;
	private queryParams$$: Subscription | undefined;

	constructor(
		private fireStorageService: FireStorageService,
		private route: ActivatedRoute,
		private router: Router
	) {}

	ngOnInit(): void {
		this.url$ = this.route.paramMap.pipe(
			switchMap((params): string => {
				this.parkingSlotId = params.get('id')!;
				return this.parkingSlotId;
			}),
			switchMap((id) => {
				return this.fireStorageService.getUrlForParkingSlotId(id + '.jpg');
			})
		);

		this.queryParams$$ = this.route.queryParamMap
			.pipe(
				tap((params: ParamMap) => {
					this.dayIndex = params.get('dayIndex');
				})
			)
			.subscribe();
	}

	ngOnDestroy(): void {
		this.queryParams$$?.unsubscribe();
	}

	cancelReservation() {
		this.router.navigate(['parking'], { queryParams: { cancel: this.parkingSlotId, dayIndex: this.dayIndex } });
	}
}

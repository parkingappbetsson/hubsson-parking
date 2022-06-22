import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParkingComponent } from './parking/parking.component';
import { AuthorizationGuard } from './services/authorization.guard';
import { SecretCodeComponent } from './secret-code/secret-code.component';
import { UserChooserComponent } from './user-chooser/user-chooser.component';
import { BadgeComponent } from './badge/badge.component';

const routes: Routes = [
	{ path: '', component: SecretCodeComponent },
	{ path: 'parking', component: ParkingComponent, canActivate: [AuthorizationGuard] },
	{ path: 'choose-user', component: UserChooserComponent, canActivate: [AuthorizationGuard] },
	{ path: 'parking/:id', component: BadgeComponent, canActivate: [AuthorizationGuard] },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}

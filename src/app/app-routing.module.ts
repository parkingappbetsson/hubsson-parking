import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParkingComponent } from './parking/parking.component';
import { ParkingGuard } from './parking/parking.guard';
import { SecretCodeComponent } from './secret-code/secret-code.component';

const routes: Routes = [
  { path: '', component: SecretCodeComponent },
  { path: 'parking', component: ParkingComponent, canActivate: [ParkingGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

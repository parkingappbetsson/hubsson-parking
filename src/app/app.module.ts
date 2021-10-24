import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ParkingComponent } from './parking/parking.component';
import { SecretCodeComponent } from './secret-code/secret-code.component';
import { UserChooserComponent } from './user-chooser/user-chooser.component';

@NgModule({
	declarations: [AppComponent, ParkingComponent, SecretCodeComponent, UserChooserComponent],
	imports: [BrowserModule, AppRoutingModule, FormsModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}

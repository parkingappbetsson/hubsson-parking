import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ParkingComponent } from './parking/parking.component';
import { SecretCodeComponent } from './secret-code/secret-code.component';
import { UserChooserComponent } from './user-chooser/user-chooser.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
	declarations: [AppComponent, ParkingComponent, SecretCodeComponent, UserChooserComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		BrowserAnimationsModule,
		MatButtonModule,
		MatInputModule,
		MatFormFieldModule,
		MatSelectModule,
		MatCardModule,
		MatBadgeModule,
		MatProgressSpinnerModule,
		HttpClientModule,
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}

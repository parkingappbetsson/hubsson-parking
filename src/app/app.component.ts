import {
  Component,
  HostBinding,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {
  dates: { date: Date; today?: boolean }[] | undefined;
  today: Date | undefined;

  @HostBinding('class.app-root') hostCss = true;

  private readonly msPerDay = 1000 * 60 * 60 * 24;
  private readonly days = Array(7).fill(0);

  ngOnInit() {
    this.today = new Date();
    const todayIndex = this.today.getDay() - 1;
    const todayTime = this.today.getTime();
    this.dates = this.days.map((_, dayIndex: number) => {
      const dateDiff = dayIndex - todayIndex;
      const timeForDayIndex = todayTime + dateDiff * this.msPerDay;
      return { date: new Date(timeForDayIndex) };
    });
    this.dates[todayIndex].today = true;
  }
}

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
  days: { date: Date }[] | undefined;
  today: Date | undefined;
  readonly parkingSlots = [
    { name: 'Hubsson1', id: '0' },
    { name: 'Hubsson2', id: '1' },
    { name: 'Páva1', id: '1' },
    { name: 'Páva2', id: '1' },
    { name: 'Páva3', id: '1' },
    { name: 'Páva4', id: '1' },
    { name: 'Páva5', id: '1' },
    { name: 'Páva6', id: '1' },
    { name: 'Páva7', id: '1' },
    { name: 'Páva8', id: '1' },
    { name: 'Páva9', id: '1' },
    { name: 'Páva10', id: '1' },
  ];

  @HostBinding('class.app-root') hostCss = true;

  private readonly msPerDay = 1000 * 60 * 60 * 24;
  private newReservations: Record<number, number> = {};

  ngOnInit() {
    this.today = new Date();
    const todayTime = this.today.getTime();
    this.days = Array(10)
      .fill(0)
      .map((_, dayIndex: number) => {
        const timeForDayIndex = todayTime + dayIndex * this.msPerDay;
        return { date: new Date(timeForDayIndex) };
      });
  }

  changeTakeParkingSlot(event: Event, column: number, row: number) {
    if (!(event.target as HTMLInputElement)?.checked) {
      return;
    }
    this.newReservations[column] = row;
  }

  onSave() {
    // TODO
  }

  isSlotFree(date: Date, parkingSlotId: string): boolean {
    // TODO
    return date && !!parkingSlotId;
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { MatCardModule }     from '@angular/material/card';
import { MatListModule }     from '@angular/material/list';
import { MatIconModule }     from '@angular/material/icon';
import { TimelineModule, TimelineAllModule } from '@syncfusion/ej2-angular-layouts';

import { TimelineEvent }     from '../../../models/workers/timelineevent';

@Component({
  standalone: true,
  selector: 'app-worker-timeline',
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    TimelineModule,
    TimelineAllModule
  ],
  templateUrl: './worker-timeline.component.html',
  styleUrls:   ['./worker-timeline.component.scss']
})
export class WorkerTimelineComponent {
  /** Pass in your array of events and we’ll loop with *ngFor */
  @Input() events: TimelineEvent[] = [];
Before: any;

  /** Syncfusion dotCss for a “check_circle” → green check */
  getDotCss(iconName: string): string {
  switch (iconName) {
    case 'created':
      return 'e-icons e-check created-dot';
    case 'settle':
      return 'e-icons e-close settle-dot';
    case 'change':
      return 'e-icons e-info change-dot';
    default:
      return '';
  }
}

  /** Firestore Timestamp → localized date string */
  formatDate(ts: any): string {
    return ts.toDate().toLocaleDateString();
  }
}

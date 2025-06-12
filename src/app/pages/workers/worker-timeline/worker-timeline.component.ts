// worker-timeline.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule }                      from '@angular/common';
import { MatCardModule }                    from '@angular/material/card';
import { MatListModule }                    from '@angular/material/list';
import { MatIconModule }                    from '@angular/material/icon';
import { TimelineModule, TimelineAllModule, TimelineItemModel } from '@syncfusion/ej2-angular-layouts';
import { TimelineEvent } from '../../../models/workers/timelineevent';

@Component({
  selector: 'app-worker-timeline',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    TimelineModule,
    TimelineAllModule
  ],
  templateUrl:  './worker-timeline.component.html',
  styleUrls:    ['./worker-timeline.component.scss']
})
export class WorkerTimelineComponent {
  @Input() events: TimelineEvent[] = [];
  
}

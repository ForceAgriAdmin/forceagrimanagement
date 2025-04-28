import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerTimelineComponent } from './worker-timeline.component';

describe('WorkerTimelineComponent', () => {
  let component: WorkerTimelineComponent;
  let fixture: ComponentFixture<WorkerTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

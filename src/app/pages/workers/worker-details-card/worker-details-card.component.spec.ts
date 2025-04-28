import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerDetailsCardComponent } from './worker-details-card.component';

describe('WorkerDetailsCardComponent', () => {
  let component: WorkerDetailsCardComponent;
  let fixture: ComponentFixture<WorkerDetailsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDetailsCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerDetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

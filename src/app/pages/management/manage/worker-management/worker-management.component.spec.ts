import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerManagementComponent } from './worker-management.component';

describe('WorkerManagementComponent', () => {
  let component: WorkerManagementComponent;
  let fixture: ComponentFixture<WorkerManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

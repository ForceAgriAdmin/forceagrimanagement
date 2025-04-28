import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerIdentityCardComponent } from './worker-identity-card.component';

describe('WorkerIdentityCardComponent', () => {
  let component: WorkerIdentityCardComponent;
  let fixture: ComponentFixture<WorkerIdentityCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerIdentityCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerIdentityCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

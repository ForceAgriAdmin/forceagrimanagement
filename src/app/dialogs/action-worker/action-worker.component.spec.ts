import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionWorkerComponent } from './action-worker.component';

describe('ActionWorkerComponent', () => {
  let component: ActionWorkerComponent;
  let fixture: ComponentFixture<ActionWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionWorkerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

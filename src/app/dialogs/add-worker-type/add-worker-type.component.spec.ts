import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWorkerTypeComponent } from './add-worker-type.component';

describe('AddWorkerTypeComponent', () => {
  let component: AddWorkerTypeComponent;
  let fixture: ComponentFixture<AddWorkerTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWorkerTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddWorkerTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

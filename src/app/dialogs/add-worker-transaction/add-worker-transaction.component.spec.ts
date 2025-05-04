import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWorkerTransactionComponent } from './add-worker-transaction.component';

describe('AddWorkerTransactionComponent', () => {
  let component: AddWorkerTransactionComponent;
  let fixture: ComponentFixture<AddWorkerTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWorkerTransactionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddWorkerTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

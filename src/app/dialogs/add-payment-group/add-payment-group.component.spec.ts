import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPaymentGroupComponent } from './add-payment-group.component';

describe('AddPaymentGroupComponent', () => {
  let component: AddPaymentGroupComponent;
  let fixture: ComponentFixture<AddPaymentGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPaymentGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPaymentGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentgroupManagementComponent } from './paymentgroup-management.component';

describe('PaymentgroupManagementComponent', () => {
  let component: PaymentgroupManagementComponent;
  let fixture: ComponentFixture<PaymentgroupManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentgroupManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentgroupManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

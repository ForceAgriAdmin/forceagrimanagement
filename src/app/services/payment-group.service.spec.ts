import { TestBed } from '@angular/core/testing';

import { PaymentGroupService } from './payment-group.service';

describe('PaymentGroupService', () => {
  let service: PaymentGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

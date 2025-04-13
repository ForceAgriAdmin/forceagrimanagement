import { TestBed } from '@angular/core/testing';

import { WorkerserviceService } from './workerservice.service';

describe('WorkerserviceService', () => {
  let service: WorkerserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkerserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

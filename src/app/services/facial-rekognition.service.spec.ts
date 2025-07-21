import { TestBed } from '@angular/core/testing';

import { FacialRekognitionService } from './facial-rekognition.service';

describe('FacialRekognitionService', () => {
  let service: FacialRekognitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacialRekognitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

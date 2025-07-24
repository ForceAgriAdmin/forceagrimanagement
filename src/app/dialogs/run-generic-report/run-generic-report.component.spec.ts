import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunGenericReportComponent } from './run-generic-report.component';

describe('RunGenericReportComponent', () => {
  let component: RunGenericReportComponent;
  let fixture: ComponentFixture<RunGenericReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunGenericReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunGenericReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

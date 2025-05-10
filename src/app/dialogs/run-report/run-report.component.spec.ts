import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunReportComponent } from './run-report.component';

describe('RunReportComponent', () => {
  let component: RunReportComponent;
  let fixture: ComponentFixture<RunReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

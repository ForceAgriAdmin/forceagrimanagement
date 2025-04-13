import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerslistComponent } from './workerslist.component';

describe('WorkerslistComponent', () => {
  let component: WorkerslistComponent;
  let fixture: ComponentFixture<WorkerslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerslistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

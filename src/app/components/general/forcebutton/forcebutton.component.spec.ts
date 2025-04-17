import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForceButtonComponent } from './forcebutton.component';

describe('ForcebuttonComponent', () => {
  let component: ForceButtonComponent;
  let fixture: ComponentFixture<ForceButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForceButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForceButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

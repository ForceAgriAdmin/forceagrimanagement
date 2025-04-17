import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForceSearchComponent } from './force-search.component';

describe('ForceSearchComponent', () => {
  let component: ForceSearchComponent;
  let fixture: ComponentFixture<ForceSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForceSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForceSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

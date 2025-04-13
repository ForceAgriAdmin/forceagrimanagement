import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenucardComponent } from './menucard.component';

describe('MenucardComponent', () => {
  let component: MenucardComponent;
  let fixture: ComponentFixture<MenucardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenucardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenucardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

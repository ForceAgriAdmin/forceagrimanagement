import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTransactionTypeComponent } from './add-transaction-type.component';

describe('AddTransactionTypeComponent', () => {
  let component: AddTransactionTypeComponent;
  let fixture: ComponentFixture<AddTransactionTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTransactionTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTransactionTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

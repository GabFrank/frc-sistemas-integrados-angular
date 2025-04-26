import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrcMultiDatepickerComponent } from './frc-multi-datepicker.component';

describe('FrcMultiDatepickerComponent', () => {
  let component: FrcMultiDatepickerComponent;
  let fixture: ComponentFixture<FrcMultiDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrcMultiDatepickerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrcMultiDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrcSearchableSelectComponent } from './frc-searchable-select.component';

describe('FrcSearchableSelectComponent', () => {
  let component: FrcSearchableSelectComponent;
  let fixture: ComponentFixture<FrcSearchableSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrcSearchableSelectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrcSearchableSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

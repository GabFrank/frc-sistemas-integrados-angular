import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedondeoDialogComponent } from './redondeo-dialog.component';

describe('RedondeoDialogComponent', () => {
  let component: RedondeoDialogComponent;
  let fixture: ComponentFixture<RedondeoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RedondeoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RedondeoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

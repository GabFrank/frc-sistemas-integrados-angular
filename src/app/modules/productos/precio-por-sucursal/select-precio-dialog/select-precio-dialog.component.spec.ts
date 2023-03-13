import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPrecioDialogComponent } from './select-precio-dialog.component';

describe('SelectPrecioDialogComponent', () => {
  let component: SelectPrecioDialogComponent;
  let fixture: ComponentFixture<SelectPrecioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectPrecioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPrecioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

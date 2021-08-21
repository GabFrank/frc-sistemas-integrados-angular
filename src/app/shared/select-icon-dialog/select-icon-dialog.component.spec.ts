import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectIconDialogComponent } from './select-icon-dialog.component';

describe('SelectIconDialogComponent', () => {
  let component: SelectIconDialogComponent;
  let fixture: ComponentFixture<SelectIconDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectIconDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectIconDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

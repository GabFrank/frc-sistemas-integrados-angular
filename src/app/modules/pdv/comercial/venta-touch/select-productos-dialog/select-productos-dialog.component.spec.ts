import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectProductosDialogComponent } from './select-productos-dialog.component';

describe('SelectProductosDialogComponent', () => {
  let component: SelectProductosDialogComponent;
  let fixture: ComponentFixture<SelectProductosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectProductosDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectProductosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

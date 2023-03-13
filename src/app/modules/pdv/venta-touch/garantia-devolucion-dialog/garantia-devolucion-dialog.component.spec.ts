import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarantiaDevolucionDialogComponent } from './garantia-devolucion-dialog.component';

describe('GarantiaDevolucionDialogComponent', () => {
  let component: GarantiaDevolucionDialogComponent;
  let fixture: ComponentFixture<GarantiaDevolucionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GarantiaDevolucionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GarantiaDevolucionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

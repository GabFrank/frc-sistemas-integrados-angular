import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarPresentacionDialogComponent } from './seleccionar-presentacion-dialog.component';

describe('SeleccionarPresentacionDialogComponent', () => {
  let component: SeleccionarPresentacionDialogComponent;
  let fixture: ComponentFixture<SeleccionarPresentacionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeleccionarPresentacionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarPresentacionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

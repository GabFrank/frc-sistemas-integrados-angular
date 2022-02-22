import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarEnvaseDialogComponent } from './seleccionar-envase-dialog.component';

describe('SeleccionarEnvaseDialogComponent', () => {
  let component: SeleccionarEnvaseDialogComponent;
  let fixture: ComponentFixture<SeleccionarEnvaseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeleccionarEnvaseDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarEnvaseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoNuevasFuncionesComponent } from './dialogo-nuevas-funciones.component';

describe('DialogoNuevasFuncionesComponent', () => {
  let component: DialogoNuevasFuncionesComponent;
  let fixture: ComponentFixture<DialogoNuevasFuncionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogoNuevasFuncionesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogoNuevasFuncionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

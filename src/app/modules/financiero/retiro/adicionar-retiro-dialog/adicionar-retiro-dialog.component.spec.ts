import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { AdicionarRetiroDialogComponent } from './adicionar-retiro-dialog.component';
import { Retiro } from '../retiro.model';

// Sin TestBed: el constructor necesita la caja y varios servicios; Ver/Nuevo/Guardar solo usan controles y vista.
describe('AdicionarRetiroDialogComponent modo Ver (#728, #734)', () => {
  let vista: any;
  const retiro = Object.assign(new Retiro(), { id: 1017, retiroGs: 50000, retiroRs: 10, retiroDs: 20, observacion: 'X' });

  beforeEach(() => {
    vista = Object.assign(Object.create(AdicionarRetiroDialogComponent.prototype), {
      responsableControl: new FormControl(null), observacionControl: new FormControl(),
      guaraniControl: new FormControl(0), realControl: new FormControl(0), dolarControl: new FormControl(0),
      stepper: { selectedIndex: 1 },
      responsableField: jasmine.createSpyObj('responsableField', ['select']),
      dialogService: jasmine.createSpyObj('dialogService', ['confirm']),
      verficarValores: () => true
    });
  });

  it('Ver carga reales en el control de reales y dólares en el de dólares, y va a Información', () => {
    vista.onVer(retiro);

    expect(vista.guaraniControl.value).toBe(50000);
    expect(vista.realControl.value).toBe(10);
    expect(vista.dolarControl.value).toBe(20);
    expect(vista.selectedRetiro).toBe(retiro);
    expect(vista.stepper.selectedIndex).toBe(0);
  });

  it('Guardar no hace nada con un retiro abierto en Ver', () => {
    vista.onVer(Object.assign(new Retiro(), retiro, { responsable: { id: 1 } }));

    vista.onGuardar();

    expect(vista.dialogService.confirm).not.toHaveBeenCalled();
  });

  it('Nuevo retiro deja el formulario vacío y habilitado', () => {
    vista.onVer(Object.assign(new Retiro(), retiro, { responsable: { id: 1 } }));

    vista.onNuevo();

    expect(vista.selectedRetiro).toBeNull();
    expect(vista.responsableControl.value).toBeNull();
    expect(vista.observacionControl.value).toBeNull();
    expect([vista.guaraniControl.value, vista.realControl.value, vista.dolarControl.value]).toEqual([0, 0, 0]);
    expect([vista.responsableControl, vista.observacionControl, vista.guaraniControl, vista.realControl, vista.dolarControl]
      .every((c: FormControl) => c.enabled)).toBeTrue();
    expect(vista.responsableField.select).toHaveBeenCalled();
  });
});

describe('AdicionarRetiroDialogComponent', () => {
  let component: AdicionarRetiroDialogComponent;
  let fixture: ComponentFixture<AdicionarRetiroDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarRetiroDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarRetiroDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

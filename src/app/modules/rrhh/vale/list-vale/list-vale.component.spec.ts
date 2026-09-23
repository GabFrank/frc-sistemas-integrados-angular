import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { ReportesRrhhService } from '../../reportes/reportes-rrhh.service';
import { ValeService } from '../vale.service';
import { ListValeComponent } from './list-vale.component';

/**
 * El gating de acciones vive en flags calculados en ngOnInit (no se llaman
 * funciones desde el HTML). Estos tests fijan los roles exactos que exige el
 * backend: confirmarVale -> RRHH APROBAR, saveVale/anularVale -> RRHH GESTIONAR.
 */
describe('ListValeComponent (gating por rol)', () => {

  let tieneAlgunRolSpy: jasmine.Spy;

  function crear(rolesConcedidos: string[]) {
    tieneAlgunRolSpy = jasmine.createSpy('tieneAlgunRol')
      .and.callFake((roles: string[]) => (roles || []).some(r => rolesConcedidos.includes(r)));

    TestBed.configureTestingModule({
      declarations: [ListValeComponent],
      providers: [
        { provide: ValeService, useValue: { onGetPage: () => of(null), onAnular: () => of(null) } },
        { provide: MainService, useValue: { tieneAlgunRol: tieneAlgunRolSpy } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(null) }) } },
        { provide: DialogosService, useValue: { confirm: () => of(false) } },
        { provide: NotificacionSnackbarService, useValue: {} },
        { provide: ReportesRrhhService, useValue: {} },
        { provide: ImpresionService, useValue: { imprimir: () => { } } }
      ]
    });
    // Template vacio: estos tests cubren la logica de gating, no el render.
    TestBed.overrideComponent(ListValeComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(ListValeComponent);
    fixture.detectChanges(); // dispara ngOnInit
    return fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('consulta exactamente los roles RRHH APROBAR y RRHH GESTIONAR', () => {
    crear([]);
    expect(tieneAlgunRolSpy).toHaveBeenCalledWith(['RRHH APROBAR']);
    expect(tieneAlgunRolSpy).toHaveBeenCalledWith(['RRHH GESTIONAR']);
  });

  it('sin roles RRHH no habilita ni confirmar ni gestionar', () => {
    const c = crear([]);
    expect(c.puedeAprobar).toBeFalse();
    expect(c.puedeGestionar).toBeFalse();
  });

  it('con solo RRHH VER no habilita confirmar (caso reportado en la issue #230)', () => {
    const c = crear(['RRHH VER']);
    expect(c.puedeAprobar).toBeFalse();
    expect(c.puedeGestionar).toBeFalse();
  });

  it('con RRHH APROBAR habilita confirmar pero no crear/anular', () => {
    const c = crear(['RRHH APROBAR']);
    expect(c.puedeAprobar).toBeTrue();
    expect(c.puedeGestionar).toBeFalse();
  });

  it('con RRHH GESTIONAR habilita crear/anular pero no confirmar', () => {
    const c = crear(['RRHH GESTIONAR']);
    expect(c.puedeAprobar).toBeFalse();
    expect(c.puedeGestionar).toBeTrue();
  });
});

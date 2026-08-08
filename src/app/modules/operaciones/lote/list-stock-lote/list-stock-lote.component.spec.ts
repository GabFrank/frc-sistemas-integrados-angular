import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { PageInfo } from '../../../../app.component';
import { MaterialModule } from '../../../../commons/core/material.module';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { EstadoLote, StockLote } from '../lote.model';
import { LoteService } from '../lote.service';
import { ListStockLoteComponent } from './list-stock-lote.component';

/**
 * Smoke test de la pantalla. Existe por un bug concreto: la tabla usa dos matRowDef (la fila del
 * lote y la fila expandible) y eso exige `multiTemplateDataRows` en el <table>. Sin ese atributo
 * MatTable lanza "There can only be one default row without a when predicate function" desde
 * ngAfterContentChecked, o sea dentro del ciclo de detección de cambios, y se lleva puesta a toda
 * la app: la pantalla queda en blanco y el sidenav deja de responder.
 *
 * El error solo aparece al renderizar, no al compilar, así que el build AOT no lo detecta.
 */
describe('ListStockLoteComponent', () => {

  let fixture: ComponentFixture<ListStockLoteComponent>;
  let loteServiceMock: jasmine.SpyObj<LoteService>;

  const stockLote: StockLote = {
    loteId: 3,
    productoId: 8868,
    productoDescripcion: 'PRUEBA34',
    numeroLote: '123',
    estado: EstadoLote.LIBERADO,
    cantidadDisponible: 3000
  };

  function paginaCon(contenido: StockLote[]): PageInfo<StockLote> {
    const pagina = new PageInfo<StockLote>();
    pagina.getContent = contenido;
    pagina.getTotalElements = contenido.length;
    return pagina;
  }

  beforeEach(async () => {
    loteServiceMock = jasmine.createSpyObj('LoteService', [
      'onBuscarStockPorLote',
      'onStockLotePorSucursal'
    ]);
    loteServiceMock.onBuscarStockPorLote.and.returnValue(of(paginaCon([stockLote])));
    loteServiceMock.onStockLotePorSucursal.and.returnValue(of([
      { sucursalId: 4, sucursalNombre: 'SUC. INDUSTRIAL', cantidadDisponible: 270 },
      { sucursalId: 5, sucursalNombre: 'SUC. KM5', cantidadDisponible: 0 }
    ]));

    await TestBed.configureTestingModule({
      declarations: [ListStockLoteComponent],
      imports: [MaterialModule, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: LoteService, useValue: loteServiceMock },
        {
          provide: SucursalService,
          useValue: { onGetAllSucursales: () => of([]) }
        },
        {
          provide: NotificacionSnackbarService,
          useValue: jasmine.createSpyObj('NotificacionSnackbarService', ['openAlgoSalioMal'])
        },
        { provide: MainService, useValue: { usuarioActual: { roles: [] } } }
      ],
      // app-generic-list y los componentes del layout no participan de lo que se prueba acá.
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ListStockLoteComponent);
  });

  it('renderiza la tabla con las dos filas por template sin romper MatTable', () => {
    // Si falta multiTemplateDataRows, este detectChanges tira desde ngAfterContentChecked.
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('ya no muestra la columna sucursal', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.displayedColumns).not.toContain('sucursal');
  });

  it('pide el desglose por sucursal al expandir una fila, y una sola vez', () => {
    fixture.detectChanges();
    const fila = fixture.componentInstance.dataSource.data[0];

    fixture.componentInstance.onFilaClick(fila);
    expect(loteServiceMock.onStockLotePorSucursal).toHaveBeenCalledOnceWith(3);
    expect(fila.sucursales.length).toBe(2);
    expect(fila.sucursales[1].sinStock).toBeTrue();

    // Cerrar y volver a abrir usa lo ya cargado en vez de consultar de nuevo.
    fixture.componentInstance.onFilaClick(fila);
    fixture.componentInstance.onFilaClick(fila);
    expect(loteServiceMock.onStockLotePorSucursal).toHaveBeenCalledTimes(1);
  });
});

import { of, throwError } from 'rxjs';

import { PageInfo } from '../../../../app.component';
import { ModificacionRegistro } from '../modificaciones.models';
import { ModificacionesComponent } from './modificaciones.component';

// Registros con fecha 2026-10-<dia>: más alto el día, más reciente.
function reg(id: number, dia: number): ModificacionRegistro {
  return { id, modificadoEn: new Date(2026, 9, dia) } as ModificacionRegistro;
}

function pagina(filas: ModificacionRegistro[], total: number): PageInfo<ModificacionRegistro> {
  const res = new PageInfo<ModificacionRegistro>();
  res.getContent = filas;
  res.getTotalElements = total;
  return res;
}

describe('ModificacionesComponent', () => {
  let component: ModificacionesComponent;
  let service: jasmine.SpyObj<any>;
  let datos: { [schema: string]: ModificacionRegistro[] };

  beforeEach(() => {
    service = jasmine.createSpyObj('ModificacionesService', ['onModificacionesPorSchemas', 'onModificacionesPorSchema']);
    // Simula al central viejo: cada esquema ordenado por fecha descendente y paginado.
    service.onModificacionesPorSchema.and.callFake((schema: string, _i: Date, _f: Date, page: number, size: number) => {
      const filas = datos[schema];
      return of(pagina(filas.slice(page * size, page * size + size), filas.length));
    });
    const notificacion = jasmine.createSpyObj('NotificacionSnackbarService', ['openWarn', 'openAlgoSalioMal']);
    const cdr = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);
    component = new ModificacionesComponent(service, notificacion, cdr);
    component.fechaInicioControl.setValue(new Date(2026, 9, 1));
    component.fechaFinalControl.setValue(new Date(2026, 9, 31));
  });

  describe('con un central que pagina varios módulos juntos', () => {
    it('pide la página a los dos módulos en una sola consulta y la muestra tal cual', () => {
      service.onModificacionesPorSchemas.and.returnValue(of(pagina([reg(2, 8), reg(12, 7)], 8)));
      component.pageSize = 2;
      component.pageIndex = 1;

      component.buscar();

      expect(service.onModificacionesPorSchemas.calls.mostRecent().args.slice(3)).toEqual([1, 2]);
      expect(service.onModificacionesPorSchemas.calls.mostRecent().args[0]).toEqual(['productos', 'operaciones']);
      expect(service.onModificacionesPorSchema).not.toHaveBeenCalled();
      expect(component.dataSource.data.map(r => r.id)).toEqual([2, 12]);
      expect(component.selectedPageInfo.getTotalElements).toBe(8);
    });

    it('otro error (timeout, red) no cae al respaldo: avisa', () => {
      service.onModificacionesPorSchemas.and.returnValue(throwError(() => ({ message: 'Timeout' })));

      component.buscar();

      expect(service.onModificacionesPorSchema).not.toHaveBeenCalled();
      expect(component.isSearching).toBeFalse();
    });

    it('con un solo módulo usa la misma consulta', () => {
      service.onModificacionesPorSchemas.and.returnValue(of(pagina([reg(3, 8)], 3)));
      component.schemaControl.setValue('financiero');

      component.buscar();

      expect(service.onModificacionesPorSchemas.calls.mostRecent().args[0]).toEqual(['financiero']);
    });
  });

  describe('con un central que todavía no tiene la consulta unida (respaldo)', () => {
    beforeEach(() => {
      // El mensaje real del alpha sin la query.
      service.onModificacionesPorSchemas.and.returnValue(throwError(() => ({
        message: "Validation error of type FieldUndefined: Field 'modificacionesPorSchemas' in type 'Query' is undefined"
      })));
    });

    it('una página intermedia muestra las filas que le tocan del resultado unido (#583)', () => {
      datos = {
        productos: [reg(1, 10), reg(2, 8), reg(3, 6), reg(4, 4)],
        operaciones: [reg(11, 9), reg(12, 7), reg(13, 5), reg(14, 3)],
      };
      component.pageSize = 2;
      component.pageIndex = 1;

      component.buscar();

      // Unido: 10, 9 | 8, 7 | 6, 5 | 4, 3 → la segunda página es 8 y 7.
      expect(component.dataSource.data.map(r => r.id)).toEqual([2, 12]);
      expect(component.selectedPageInfo.getTotalElements).toBe(8);
    });

    it('recorriendo todas las páginas se ve cada registro una sola vez', () => {
      datos = {
        productos: [reg(1, 10), reg(2, 8), reg(3, 6), reg(4, 4)],
        operaciones: [reg(11, 9), reg(12, 7), reg(13, 5), reg(14, 3)],
      };
      component.pageSize = 3;
      const vistos: number[] = [];
      for (let p = 0; p < 3; p++) {
        component.pageIndex = p;
        component.buscar();
        vistos.push(...component.dataSource.data.map(r => r.id));
      }
      expect(vistos).toEqual([1, 11, 2, 12, 3, 13, 4, 14]);
    });

    it('con fechas iguales ordena por id descendente', () => {
      datos = { productos: [reg(1, 10)], operaciones: [reg(11, 10)] };

      component.buscar();

      expect(component.dataSource.data.map(r => r.id)).toEqual([11, 1]);
    });

    it('con un solo módulo pide la página tal cual', () => {
      datos = { financiero: [reg(1, 10), reg(2, 9), reg(3, 8)] };
      component.schemaControl.setValue('financiero');
      component.pageSize = 2;
      component.pageIndex = 1;

      component.buscar();

      expect(service.onModificacionesPorSchema.calls.mostRecent().args.slice(3)).toEqual([1, 2]);
      expect(component.dataSource.data.map(r => r.id)).toEqual([3]);
    });
  });
});

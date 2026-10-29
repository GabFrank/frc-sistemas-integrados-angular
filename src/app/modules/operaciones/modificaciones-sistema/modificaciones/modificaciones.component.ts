import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { ModificacionesService } from '../modificaciones.service';
import { ModificacionRegistro, ModificacionDetalle } from '../modificaciones.models';
import { PageInfo } from '../../../../app.component';
import {
  getFirstDayOfMonths,
  getLastDayOfMonths,
} from '../../../../commons/core/utils/dateUtils';
import { combineDateTime } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { forkJoin, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'modificaciones',
  templateUrl: './modificaciones.component.html',
  styleUrls: ['./modificaciones.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModificacionesComponent implements OnInit, AfterViewInit {
  titulo = 'Modificaciones del Sistema';
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<ModificacionRegistro>();

  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl('00:00');
  horaFinalControl = new FormControl('23:59');
  schemaControl = new FormControl('productos', [Validators.required]);
  tipoEntidadControl = new FormControl(null);
  fechaFormGroup: FormGroup;

  selectedModificacion: ModificacionRegistro;
  expandedModificacion: ModificacionRegistro;
  detallesModificacion: ModificacionDetalle[] = [];
  loadingDetalles = false;

  displayedColumns: string[] = [
    'id',
    'tipoEntidad',
    'entidadId',
    'tipoOperacion',
    'usuario',
    'sucursal',
    'modificadoEn',
    'acciones',
  ];

  pageIndex = 0;
  pageSize = 15;
  selectedPageInfo: PageInfo<ModificacionRegistro>;

  schemaOptions = [
    { value: 'productos', label: 'PRODUCTOS' },
    { value: 'operaciones', label: 'OPERACIONES' },
    { value: 'financiero', label: 'FINANCIERO' },
    { value: 'personas', label: 'PERSONAS' },
    { value: 'empresarial', label: 'EMPRESARIAL' },
    { value: 'general', label: 'GENERAL' },
    { value: 'configuraciones', label: 'CONFIGURACIONES' },
  ];

  tipoEntidadOptions = [
    { value: null, label: 'TODOS' },
    { value: 'PRODUCTO', label: 'PRODUCTO' },
    { value: 'PRESENTACION', label: 'PRESENTACIÓN' },
    { value: 'CODIGO', label: 'CÓDIGO' },
    { value: 'PRECIO_POR_SUCURSAL', label: 'PRECIO POR SUCURSAL' },
    { value: 'COSTO_POR_PRODUCTO', label: 'COSTO POR PRODUCTO' },
    { value: 'AJUSTE_STOCK', label: 'AJUSTE DE STOCK' },
  ];

  today = new Date();
  isSearching = false;

  constructor(
    private service: ModificacionesService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
    });
  }

  ngOnInit(): void {
    const inicio = getFirstDayOfMonths(-1);
    const fin = new Date();
    this.fechaInicioControl.setValue(inicio);
    this.fechaFinalControl.setValue(fin);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buscar();
    }, 500);
  }

  // Un filtro nuevo arranca en la página 1: la página actual puede no existir en el resultado filtrado.
  onFiltrar(): void {
    // Validar antes: si no, el paginador quedaría en 1 con la tabla todavía en la página anterior.
    if (!this.filtrosValidos()) {
      return;
    }
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.buscar();
  }

  private filtrosValidos(): boolean {
    if (!this.schemaControl.value) {
      this.notificacionService.openWarn('Debe seleccionar un módulo');
      return false;
    }
    if (!this.fechaInicioControl.value || !this.fechaFinalControl.value) {
      this.notificacionService.openWarn('Debe seleccionar un rango de fechas');
      return false;
    }
    return true;
  }

  buscar(): void {
    if (!this.filtrosValidos()) {
      return;
    }

    this.isSearching = true;
    this.expandedModificacion = null;
    this.selectedModificacion = null;
    this.detallesModificacion = [];

    const fechaInicio = combineDateTime(
      this.fechaInicioControl.value,
      this.horaInicioControl.value || '00:00'
    );
    const fechaFin = combineDateTime(
      this.fechaFinalControl.value,
      this.horaFinalControl.value || '23:59'
    );

    const schemasABuscar: string[] = [this.schemaControl.value];
    if (this.schemaControl.value === 'productos') {
      schemasABuscar.push('operaciones');
    }

    if (this.tipoEntidadControl.value) {
      let schemaParaBuscar: string;

      if (this.tipoEntidadControl.value === 'AJUSTE_STOCK') {
        schemaParaBuscar = 'operaciones';
      } else {
        schemaParaBuscar = this.schemaControl.value;
      }

      const busquedas = [this.service.onModificacionesPorTipoEntidadAndSchema(
        this.tipoEntidadControl.value,
        schemaParaBuscar,
        fechaInicio,
        fechaFin,
        this.pageIndex,
        this.pageSize
      )];

      if (busquedas.length === 0) {
        this.isSearching = false;
        this.dataSource.data = [];
        return;
      }

      forkJoin(busquedas)
        .pipe(untilDestroyed(this))
        .subscribe(
          (resultados: PageInfo<ModificacionRegistro>[]) => {
            let contenidoCombinado: ModificacionRegistro[] = [];
            let totalElementos = 0;

            resultados.forEach(res => {
              if (res.getContent) {
                contenidoCombinado = contenidoCombinado.concat(res.getContent);
                totalElementos += res.getTotalElements || 0;
              }
            });

            // Ordenar por fecha descendente
            contenidoCombinado.sort((a, b) => {
              const fechaA = new Date(a.modificadoEn).getTime();
              const fechaB = new Date(b.modificadoEn).getTime();
              return fechaB - fechaA;
            });

            // Mapear para evitar métodos en template
            const contenidoProcesado = contenidoCombinado.map(reg => ({
              ...reg,
              tipoOperacionLabel: this.getTipoOperacionLabel(reg.tipoOperacion),
              tipoOperacionColor: this.getTipoOperacionColor(reg.tipoOperacion)
            }));

            const contenidoPaginado = contenidoProcesado.slice(0, this.pageSize);

            // No re-vincular todo, solo actualizar datos
            this.selectedPageInfo = resultados[0] || new PageInfo<ModificacionRegistro>();
            this.selectedPageInfo.getTotalElements = totalElementos;
            this.dataSource.data = contenidoPaginado;

            this.isSearching = false;
            this.cdr.markForCheck();

            if (contenidoProcesado.length === 0) {
              this.notificacionService.openWarn('No se encontraron modificaciones');
            }
          },
          (error) => {
            this.isSearching = false;
            this.notificacionService.openWarn('Error al buscar modificaciones');
            this.cdr.markForCheck();
          }
        );
    } else {
      const pagina = this.pageIndex;
      const tamanio = this.pageSize;
      // Los módulos se paginan juntos en el central: pedir la página N a cada uno pierde filas (#583).
      this.service
        .onModificacionesPorSchemas(schemasABuscar, fechaInicio, fechaFin, pagina, tamanio)
        .pipe(
          // shortcut: respaldo para un central que todavía no tiene modificacionesPorSchemas; borrarlo cuando todos los canales la tengan.
          // Solo si el central no conoce la query: un timeout o un error de red no se repite con consultas más pesadas.
          catchError(e => /FieldUndefined|Cannot query field/.test(e?.message)
            ? this.unirEnCliente(schemasABuscar, fechaInicio, fechaFin, pagina, tamanio)
            : throwError(() => e)),
          untilDestroyed(this)
        )
        .subscribe(
          (resultado: PageInfo<ModificacionRegistro>) => {
            this.selectedPageInfo = resultado;
            this.dataSource.data = resultado.getContent.map(reg => ({
              ...reg,
              tipoOperacionLabel: this.getTipoOperacionLabel(reg.tipoOperacion),
              tipoOperacionColor: this.getTipoOperacionColor(reg.tipoOperacion)
            }));

            this.isSearching = false;
            this.cdr.markForCheck();

            if (resultado.getTotalElements === 0) {
              this.notificacionService.openWarn('No se encontraron modificaciones');
            }
          },
          (error) => {
            this.isSearching = false;
            this.notificacionService.openWarn('Error al buscar modificaciones');
            this.cdr.markForCheck();
          }
        );
    }
  }

  // Cada módulo trae desde el principio hasta el final de la página pedida y la página se corta del
  // resultado unido, con el id como desempate de fechas iguales.
  private unirEnCliente(
    schemas: string[],
    inicio: Date,
    fin: Date,
    pagina: number,
    tamanio: number
  ): Observable<PageInfo<ModificacionRegistro>> {
    const varios = schemas.length > 1;
    const desde = varios ? pagina * tamanio : 0;
    const hasta = desde + tamanio;
    const busquedas = schemas.map(schema =>
      this.service.onModificacionesPorSchema(schema, inicio, fin, varios ? 0 : pagina, hasta)
    );
    return forkJoin(busquedas).pipe(
      map(resultados => {
        const unido = new PageInfo<ModificacionRegistro>();
        unido.getTotalElements = resultados.reduce((total, r) => total + (r.getTotalElements || 0), 0);
        unido.getContent = [].concat(...resultados.map(r => r.getContent || []))
          .sort((a: ModificacionRegistro, b: ModificacionRegistro) =>
            new Date(b.modificadoEn).getTime() - new Date(a.modificadoEn).getTime() || b.id - a.id)
          .slice(desde, hasta);
        return unido;
      })
    );
  }


  resetFiltro(): void {
    const inicio = getFirstDayOfMonths(-1);
    const fin = new Date();
    this.fechaInicioControl.setValue(inicio);
    this.fechaFinalControl.setValue(fin);
    this.horaInicioControl.setValue('00:00');
    this.horaFinalControl.setValue('23:59');
    this.schemaControl.setValue('productos');
    this.tipoEntidadControl.setValue(null);
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.selectedPageInfo = null;
    this.dataSource.data = [];
    this.expandedModificacion = null;
    this.selectedModificacion = null;
    this.detallesModificacion = [];
    this.cdr.markForCheck();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
  }

  toggleRow(row: ModificacionRegistro): void {
    const isCurrentlyExpanded = this.expandedModificacion?.id === row.id;
    this.expandedModificacion = isCurrentlyExpanded ? null : row;
    this.onRowClick(row, isCurrentlyExpanded);
  }

  onRowClick(row: ModificacionRegistro, isCurrentlyExpanded: boolean): void {
    if (!isCurrentlyExpanded) {
      this.selectedModificacion = row;
      this.loadingDetalles = true;
      this.detallesModificacion = [];

      this.service
        .onGetDetallesModificacion(row.id)
        .pipe(untilDestroyed(this))
        .subscribe(
          (detalles) => {
            this.detallesModificacion = detalles || [];
            this.loadingDetalles = false;
            this.cdr.markForCheck();
          },
          (error) => {
            this.loadingDetalles = false;
            this.notificacionService.openAlgoSalioMal('Error al cargar detalles');
            this.cdr.markForCheck();
          }
        );
    }
  }

  cambiarFecha(opcion: string): void {
    let inicio: Date;
    let fin: Date = new Date();

    switch (opcion) {
      case 'dia':
        inicio = new Date();
        inicio.setDate(inicio.getDate() - 7);
        break;
      case 'mes':
        inicio = getFirstDayOfMonths(0);
        fin = getLastDayOfMonths(0);
        break;
      case '2mes':
        inicio = getFirstDayOfMonths(-1);
        fin = getLastDayOfMonths(-1);
        break;
      case '3mes':
        inicio = getFirstDayOfMonths(-3);
        break;
      default:
        inicio = getFirstDayOfMonths(-1);
    }

    this.fechaInicioControl.setValue(inicio);
    this.fechaFinalControl.setValue(fin);
    this.cdr.markForCheck();
  }
  getTipoOperacionLabel(tipo: string): string {
    const labels = {
      INSERT: 'CREAR',
      UPDATE: 'MODIFICAR',
      DELETE: 'ELIMINAR',
      SOFT_DELETE: 'ELIMINAR (SOFT)',
    };
    return labels[tipo] || tipo;
  }

  getTipoOperacionColor(tipo: string): string {
    const colors = {
      INSERT: '#4caf50',
      UPDATE: '#ff9800',
      DELETE: '#f44336',
      SOFT_DELETE: '#9e9e9e',
    };
    return colors[tipo] || '#ffffff';
  }
}

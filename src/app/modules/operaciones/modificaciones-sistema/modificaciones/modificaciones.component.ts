import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
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
    private notificacionService: NotificacionSnackbarService
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
      this.onFiltrar();
    }, 500);
  }

  onFiltrar(): void {
    if (!this.schemaControl.value) {
      this.notificacionService.openWarn('Debe seleccionar un módulo');
      return;
    }

    if (!this.fechaInicioControl.value || !this.fechaFinalControl.value) {
      this.notificacionService.openWarn('Debe seleccionar un rango de fechas');
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

    if (this.tipoEntidadControl.value) {
      this.service
        .onModificacionesPorTipoEntidad(
          this.tipoEntidadControl.value,
          this.pageIndex,
          this.pageSize
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            let filteredContent = res.getContent || [];
            if (this.schemaControl.value) {
              filteredContent = filteredContent.filter(
                (m: ModificacionRegistro) => m.schemaNombre === this.schemaControl.value
              );
            }
            filteredContent = filteredContent.filter((m: ModificacionRegistro) => {
              const fechaMod = new Date(m.modificadoEn);
              return fechaMod >= fechaInicio && fechaMod <= fechaFin;
            });

            this.selectedPageInfo = res;
            this.selectedPageInfo.getContent = filteredContent;
            this.selectedPageInfo.getTotalElements = filteredContent.length;
            this.dataSource.data = filteredContent;
            this.isSearching = false;

            if (filteredContent.length === 0) {
              this.notificacionService.openWarn('No se encontraron modificaciones');
            }
          },
          (error) => {
            this.isSearching = false;
            this.notificacionService.openWarn('Error al buscar modificaciones');
          }
        );
    } else {
      this.service
        .onModificacionesPorSchema(
          this.schemaControl.value,
          fechaInicio,
          fechaFin,
          this.pageIndex,
          this.pageSize
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            this.selectedPageInfo = res;
            this.dataSource.data = res.getContent || [];
            this.isSearching = false;

            if (!res.getContent || res.getContent.length === 0) {
              this.notificacionService.openWarn('No se encontraron modificaciones');
            }
          },
          (error) => {
            this.isSearching = false;
            this.notificacionService.openWarn('Error al buscar modificaciones');
          }
        );
    }
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
    this.dataSource.data = [];
    this.expandedModificacion = null;
    this.selectedModificacion = null;
    this.detallesModificacion = [];
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
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
          },
          (error) => {
            this.loadingDetalles = false;
            this.notificacionService.openAlgoSalioMal('Error al cargar detalles');
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

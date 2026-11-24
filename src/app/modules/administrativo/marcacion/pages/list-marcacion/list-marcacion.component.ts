import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../../main.service';
import { PaginacionLista, PaginaCentral } from '../../../../../shared/components/paginacion/paginacion-lista';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { MarcacionService } from '../../service/marcacion.service';
import { Jornada, JornadaResumen } from '../../models/jornada.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { BuscadorFieldComponent } from '../../../../../shared/components/buscador-field/buscador-field.component';
import { FechaPyDateAdapter } from '../../../../../shared/utils/fecha-py-date-adapter';
import { AsignarHorarioDialogComponent } from '../../../horarios/components/asignar-horario-dialog/asignar-horario-dialog.component';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { HorarioService } from '../../../horarios/service/horario.service';
import { HorarioInput } from '../../../horarios/models/horario.model';
import { TabService, TabData } from '../../../../../layouts/tab/tab.service';
import { Tab } from '../../../../../layouts/tab/tab.model';
import { ObservacionJornadaDialogComponent } from '../../components/observacion-jornada-dialog.component';
import { EstadoJornada } from '../../enums/estado-jornada.enum';
import { UbicacionMarcacionComponent } from '../ubicacion-marcacion/ubicacion-marcacion.component';
import { avisoTrasMutacion, erroresDeRechazo, RECARGA_TRAS_CORTE_MS } from '../../../../../commons/core/utils/graphqlErrorUtils';


/**
 * Una jornada lista para dibujar. Los valores los calcula el central; acá solo se les da el texto y el color con
 * que se muestran, una vez por carga, así la plantilla lee propiedades y no ejecuta funciones.
 */
export interface JornadaFila extends Jornada {
  llegadaTardiaTexto: string;
  llegadaTardiaColor: string;
  horaExtraTexto: string;
  turnoTexto: string;
  fechaSalidaMostrada: string;
  distanciaTexto: string;
  conUbicacion: boolean;
  ubicacionTitulo: string;
  salidaAlmuerzoFecha: string;
  retornoAlmuerzoFecha: string;
  tardiaAlmuerzoTexto: string;
  tardiaAlmuerzoColor: string;
  trabajadoTexto: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'list-marcacion',
  templateUrl: './list-marcacion.component.html',
  styleUrls: ['./list-marcacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Las fechas escritas a mano se leen dia/mes, como se muestran: el adapter nativo leia 3/10 como 10 de marzo (#802).
  providers: [{ provide: DateAdapter, useClass: FechaPyDateAdapter }],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ]
})
export class ListMarcacionComponent implements OnInit {
  estadoJornada = EstadoJornada;

  pag = new PaginacionLista<JornadaFila>({
    cargar: (page, size) => this.pedirPagina(page, size),
    pageSize: 15,
  });

  /** El usuario elegido en el buscador (objeto), o `null`. Es el filtro de funcionario. */
  usuarioControl = new FormControl<Usuario>(null);
  @ViewChild(BuscadorFieldComponent) buscadorUsuario: BuscadorFieldComponent;
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  turnoControl = new FormControl('TODOS');
  listaTurnos = [
    { code: 'TODOS', name: 'Todos' },
    { code: 'DIA', name: 'Día' },
    { code: 'NOCHE', name: 'Noche' },
    { code: 'MADRUGADA', name: 'Madrugada' }
  ];
  sucursalEntradaControl = new FormControl(null);
  sucursalSalidaControl = new FormControl(null);
  listaSucursales: Sucursal[] = [];
  fechaFormGroup: FormGroup;

  hoy = new Date();
  mesResumen: string;
  diasTrabajados: number;
  horasTrabajadas: string;
  horasExtras: string;
  horasAtraso: string;

  expandedMarcacion: JornadaFila | null;

  displayedColumns = [
    'id',
    'fecha',
    'usuario',
    'estado',
    'sucursalEntrada',
    'fechaEntrada',
    'sucursalSalida',
    'fechaSalida',
    'llegadaTardia',
    'horaExtra',
    'turno',
    'distancia',
    'ubicacion',
    'acciones'
  ];

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef,
    private horarioService: HorarioService,
    private tabService: TabService,
    private sucursalService: SucursalService
  ) { }

  selectedJornada: JornadaFila;

  /**
   * El buscador eligio un usuario o se quito con la X: se filtra enseguida, como turno y sucursal. Al editar el
   * texto de uno ya elegido tambien llega `null`, pero ahi todavia no hay a quien buscar: se espera la eleccion.
   */
  onUsuarioElegido(usuario: Usuario): void {
    if (usuario == null && this.textoUsuarioPendiente()) return;
    this.filtrar();
  }

  /** Hay un nombre o id escrito que todavia no se convirtio en un usuario elegido. */
  private textoUsuarioPendiente(): boolean {
    return this.usuarioControl.value == null && !!this.buscadorUsuario?.textoControl.value?.trim();
  }

  /**
   * Boton Buscar. Con un nombre escrito y sin elegir, antes buscaba a todos sin avisar (#802): ahora abre el
   * buscador con ese texto y, al elegir, filtra.
   */
  onBuscar(): void {
    if (this.textoUsuarioPendiente()) {
      this.buscadorUsuario.abrir();
      return;
    }
    this.filtrar();
  }

  trackById(_: number, jornada: JornadaFila): string {
    return `${jornada.id}-${jornada.sucursalId}`;
  }

  onExpand(row: JornadaFila): void {
    this.expandedMarcacion = this.expandedMarcacion === row ? null : row;
    this.selectedJornada = row;
  }

  ngOnInit(): void {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    });

    this.inicializarFechas();
    this.cargarSucursales();
    this.turnoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.filtrar();
    });
    this.sucursalEntradaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.filtrar();
    });
    this.sucursalSalidaControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.filtrar();
    });
    this.filtrar();
  }

  cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe(sucursales => {
        this.listaSucursales = sucursales || [];
        this.cdr.markForCheck();
      });
  }

  inicializarFechas(): void {
    const ayer = new Date();
    ayer.setDate(this.hoy.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);
    this.fechaInicioControl.setValue(ayer);
    this.fechaFinControl.setValue(this.hoy);
  }

  /** Una búsqueda nueva (botón o cambio de filtro) arranca en la primera página. */
  filtrar(): void {
    if (!this.rangoDeFechasValido()) return;
    this.pag.filtrar();
  }

  /**
   * Fecha mal escrita, posterior a hoy o un fin antes del inicio: antes salia la lista vacia sin aviso (#802).
   * El error de lectura se mira antes de completar: una fecha mal escrita deja el control en null, y completar
   * la reemplazaria por hoy sin decir nada.
   */
  private rangoDeFechasValido(): boolean {
    const malEscrita = this.fechaInicioControl.hasError('matDatepickerParse') || this.fechaFinControl.hasError('matDatepickerParse');
    if (!malEscrita) this.completarFechas();
    if (malEscrita || this.fechaFormGroup.invalid) {
      this.notificacionService.openWarn('Revisá el rango de fechas: una fecha no es válida o el fin es anterior al inicio.');
      return false;
    }
    return true;
  }

  /** Sin fin, hasta hoy; sin inicio, una semana antes del fin. */
  private completarFechas(): void {
    if (this.fechaFinControl.value == null) {
      this.fechaFinControl.setValue(this.hoy);
    }
    if (this.fechaInicioControl.value == null) {
      // Desde la fecha fin: antes se le restaban 7 dias al dia del fin pero en el mes actual (#802).
      const unaSemanaAntes = new Date(this.fechaFinControl.value);
      unaSemanaAntes.setDate(unaSemanaAntes.getDate() - 7);
      unaSemanaAntes.setHours(0, 0, 0, 0);
      this.fechaInicioControl.setValue(unaSemanaAntes);
    }
  }

  /** Repite la página actual. */
  private cargar(): void {
    this.pag.recargar();
  }

  /** Pide al central una página: él filtra, pagina y suma el resumen. */
  private pedirPagina(page: number, size: number): Observable<PaginaCentral<JornadaFila>> {
    this.completarFechas();
    const turno = this.turnoControl.value;
    const filtro = {
      usuarioId: this.usuarioControl.value?.id || null,
      fechaInicio: dateToString(this.fechaInicioControl.value, 'yyyy-MM-dd'),
      fechaFin: dateToString(this.fechaFinControl.value, 'yyyy-MM-dd'),
      turno: turno && turno !== 'TODOS' ? turno : null,
      sucursalEntradaId: this.sucursalEntradaControl.value || null,
      sucursalSalidaId: this.sucursalSalidaControl.value || null
    };

    // La lista descarta la respuesta de una página vieja si se pide otra antes (PaginacionLista).
    return this.marcacionService.onGetJornadasHistorial(filtro, page, size).pipe(
      map(res => {
        if (res == null) return null;
        this.expandedMarcacion = null;
        this.mostrarResumen(res.resumen);
        this.cdr.markForCheck();
        return { ...res.pagina, getContent: (res.pagina?.getContent || []).map(j => this.aFila(j)) };
      })
    );
  }

  private aFila(jornada: Jornada): JornadaFila {
    const turno = jornada.turno ? String(jornada.turno) : '';
    return {
      ...jornada,
      llegadaTardiaTexto: this.formatMinutes(jornada.minutosLlegadaTardiaTotal),
      llegadaTardiaColor: this.getColorLlegadaTardia(jornada.minutosLlegadaTardiaTotal),
      horaExtraTexto: this.formatMinutes(jornada.minutosExtras),
      turnoTexto: turno ? turno.charAt(0).toUpperCase() + turno.slice(1).toLowerCase() : '-',
      fechaSalidaMostrada: jornada.marcacionSalida?.fechaSalida || jornada.marcacionSalida?.fechaEntrada,
      distanciaTexto: jornada.distanciaMaximaMetros != null ? `${jornada.distanciaMaximaMetros} m` : '-',
      conUbicacion: !!jornada.tieneUbicacion,
      ubicacionTitulo: jornada.tieneUbicacion ? 'Ver la ubicación de marcación' : 'La jornada no guardó ubicación',
      salidaAlmuerzoFecha: jornada.marcacionSalidaAlmuerzo?.fechaSalida || jornada.marcacionSalidaAlmuerzo?.fechaEntrada,
      retornoAlmuerzoFecha: jornada.marcacionEntradaAlmuerzo?.fechaEntrada,
      tardiaAlmuerzoTexto: this.formatMinutes(jornada.minutosLlegadaTardiaAlmuerzo),
      tardiaAlmuerzoColor: this.getColorLlegadaTardia(jornada.minutosLlegadaTardiaAlmuerzo),
      trabajadoTexto: this.formatMinutes(jornada.minutosTrabajados)
    };
  }

  private mostrarResumen(resumen: JornadaResumen): void {
    this.diasTrabajados = resumen?.diasTrabajados || 0;
    this.horasTrabajadas = this.formatMinutes(resumen?.minutosTrabajados);
    this.horasExtras = this.formatMinutes(resumen?.minutosExtras);
    this.horasAtraso = this.formatMinutes(resumen?.minutosLlegadaTardia);

    if (this.fechaInicioControl.value) {
      const date = new Date(this.fechaInicioControl.value);
      this.mesResumen = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    }
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '00:00';
    let minA = Math.abs(minutes);
    const hours = Math.floor(minA / 60);
    const mins = minA % 60;
    return `${minutes < 0 ? '-' : ''}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  getColorLlegadaTardia(minutos: number): string {
    if (minutos == null) return '';
    if (minutos > 10) return '#f44336';
    if (minutos >= 5) return '#ffeb3b';
    return '#4caf50';
  }

  resetearFiltro(): void {
    // writeValue del buscador: tambien borra el texto escrito, sin emitir (seleccionado).
    this.usuarioControl.setValue(null);
    this.inicializarFechas();
    // Sin emitir: la consulta de abajo ya lleva los tres filtros, y se hace una sola vez.
    this.turnoControl.setValue('TODOS', { emitEvent: false });
    this.sucursalEntradaControl.setValue(null, { emitEvent: false });
    this.sucursalSalidaControl.setValue(null, { emitEvent: false });
    this.filtrar();
  }

  /** Todos los horarios, sin importar el funcionario elegido: se comparten entre funcionarios. */
  onAdicionarHorario(): void {
    this.tabService.addTab(
      new Tab(
        AsignarHorarioDialogComponent,
        'Asignar Horario',
        null,
        ListMarcacionComponent
      )
    );
  }

  onVerUbicacion(jornada: JornadaFila): void {
    if (!jornada?.conUbicacion) return;
    this.tabService.addTab(
      new Tab(
        UbicacionMarcacionComponent,
        'Ubicación de marcación',
        new TabData(jornada.id, jornada),
        ListMarcacionComponent
      )
    );
  }

  onGenerarPdf(): void {
    if (!this.rangoDeFechasValido()) return;

    const fechaInicio = this.fechaInicioControl.value
      ? dateToString(this.fechaInicioControl.value, 'yyyy-MM-dd')
      : null;
    const fechaFin = this.fechaFinControl.value
      ? dateToString(this.fechaFinControl.value, 'yyyy-MM-dd')
      : null;
    const usuarioId = this.usuarioControl.value?.id || null;

    this.marcacionService.onImprimirReporteMarcaciones(usuarioId, fechaInicio, fechaFin);
  }

  onAjustar8Horas(marcacion: any): void {
    this.matDialog.open(ObservacionJornadaDialogComponent, {
      data: {
        title: 'Ajustar Jornada a 8 Horas',
        observacion: marcacion.observacion,
        required: false
      },
      width: '450px'
    }).afterClosed().subscribe(obs => {
      if (obs !== undefined) {
        this.marcacionService.onAjustarJornadaA8Horas(marcacion.id, marcacion.sucursalId, obs)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (res) => {
              if (res) {
                this.notificacionService.openSucess('Jornada ajustada correctamente');
                this.cargar();
              } else {
                // El central devuelve null si la jornada no existe: antes quedaba en silencio (#501)
                this.notificacionService.openWarn('No se pudo ajustar la jornada: no se encontró.');
              }
            },
            error: (e) => this.avisarSinRespuesta(e, 'se ajustó la jornada'),
          });
      }
    });
  }

  onAgregarObservacion(marcacion: any): void {
    this.matDialog.open(ObservacionJornadaDialogComponent, {
      data: {
        title: 'Agregar Observación',
        observacion: marcacion.observacion,
        required: true
      },
      width: '450px'
    }).afterClosed().subscribe(obs => {
      if (obs !== undefined && obs !== null) {
        this.marcacionService.onGuardarObservacionJornada(marcacion.id, marcacion.sucursalId, obs)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (res) => {
              if (res) {
                this.notificacionService.openSucess('Observación guardada correctamente');
                this.cargar();
              } else {
                // El central devuelve null si la jornada no existe: antes quedaba en silencio (#501)
                this.notificacionService.openWarn('No se pudo guardar la observación: no se encontró la jornada.');
              }
            },
            error: (e) => this.avisarSinRespuesta(e, 'se guardó la observación'),
          });
      }
    });
  }

  /**
   * En un rechazo el genérico ya mostró el motivo. Sin respuesta pudo aplicarse; repetir es seguro (pisa el mismo valor):
   * se avisa y la lista se recarga cuando el central tuvo tiempo de terminar (#501).
   */
  private avisarSinRespuesta(error: any, queSeHizo: string): void {
    if (erroresDeRechazo(error) != null) {
      return;
    }
    const aviso = avisoTrasMutacion(error, queSeHizo);
    if (aviso != null) {
      this.notificacionService.openWarn(aviso, 8);
    }
    timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this)).subscribe(() => this.cargar());
  }
}

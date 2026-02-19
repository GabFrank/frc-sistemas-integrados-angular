import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../../main.service';
import { PageInfo } from '../../../../../app.component';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { MarcacionService } from '../../service/marcacion.service';
import { Marcacion } from '../../models/marcacion.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { UsuarioSearchGQL } from '../../../../personas/usuarios/graphql/usuarioSearch';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { UsuarioService } from '../../../../personas/usuarios/usuario.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { PersonaService } from '../../../../personas/persona/persona.service';
import { AsignarHorarioDialogComponent } from '../../../horarios/components/asignar-horario-dialog/asignar-horario-dialog.component';
import { HorarioService } from '../../../horarios/service/horario.service';
import { HorarioInput } from '../../../horarios/models/horario.model';


@UntilDestroy()
@Component({
  selector: 'list-marcacion',
  templateUrl: './list-marcacion.component.html',
  styleUrls: ['./list-marcacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  selectedPageInfo: PageInfo<any>;
  pageIndex = 0;
  pageSize = 15;

  usuarioIdControl = new FormControl();
  usuarioNombreControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  turnoControl = new FormControl('TODOS');
  listaTurnos = [
    { code: 'TODOS', name: 'Todos' },
    { code: 'DIA', name: 'Día' },
    { code: 'NOCHE', name: 'Noche' },
    { code: 'MADRUGADA', name: 'Madrugada' }
  ];
  fechaFormGroup: FormGroup;

  usuarioSeleccionado: Usuario = null;
  hoy = new Date();
  mesResumen: string;
  diasTrabajados: number;
  horasTrabajadas: string;
  horasExtras: string;
  horasAtraso: string;

  expandedMarcacion: Marcacion | null;

  displayedColumns = [
    'id',
    'usuario',
    'sucursalEntrada',
    'fechaEntrada',
    'sucursalSalida',
    'fechaSalida',
    'llegadaTardia',
    'horaExtra',
    'turno'
  ];

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private matDialog: MatDialog,
    private personaService: PersonaService,
    private usuarioService: UsuarioService,
    private searchUsuario: UsuarioSearchGQL,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef,
    private horarioService: HorarioService
  ) { }

  buscarUsuario(): void {
    const valor = this.usuarioIdControl.value;
    if (valor) {
      if (!isNaN(valor)) {
        this.usuarioService.onGetUsuarioPorPersonaId(valor)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res) {
              this.seleccionarUsuario(res);
            } else {
              this.mensajeErrorPersona(valor);
            }
          });
      } else {
        this.abrirBuscadorUsuario();
      }
    } else {
      this.abrirBuscadorUsuario();
    }
  }

  mensajeErrorPersona(id: number): void {
    this.personaService.onGetPersona(id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.notificacionService.openWarn('La persona encontrada no tiene usuario asociado. Debe crear un usuario para esta persona.');
        } else {
          this.notificacionService.openWarn('No se encontró ninguna persona con ese ID');
        }
        this.usuarioIdControl.setErrors({ invalid: true });
      });
  }

  selectedJornada: any;

  seleccionarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.usuarioNombreControl.setValue(usuario.persona?.nombre);
    this.usuarioIdControl.setValue(usuario.id);
    this.filtrar();
  }

  onExpand(row: any): void {
    this.expandedMarcacion = this.expandedMarcacion === row ? null : row;
    this.selectedJornada = row;
  }

  ngOnInit(): void {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    });

    this.inicializarFechas();
    this.filtrar();
  }

  inicializarFechas(): void {
    const ayer = new Date();
    ayer.setDate(this.hoy.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);
    this.fechaInicioControl.setValue(ayer);
    this.fechaFinControl.setValue(this.hoy);
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.filtrar();
  }

  filtrar(): void {
    if (this.fechaFinControl.value == null) {
      this.fechaFinControl.setValue(this.hoy);
    }

    if (this.fechaInicioControl.value == null) {
      const unaSemanaAtras = new Date();
      unaSemanaAtras.setDate(this.fechaFinControl.value.getDate() - 7);
      this.fechaInicioControl.setValue(unaSemanaAtras);
    }

    const page = this.pageIndex;
    const size = this.pageSize;

    if (this.usuarioSeleccionado?.id) {
      const fechaInicio = dateToString(this.fechaInicioControl.value);
      const fechaFin = dateToString(this.fechaFinControl.value);

      this.marcacionService.onGetJornadasPorUsuario(
        this.usuarioSeleccionado.id,
        fechaInicio,
        fechaFin
      ).pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.dataSource.data = res || [];
            this.selectedPageInfo = {
              getTotalElements: res ? res.length : 0,
              getContent: res || [],
              getTotalPages: 1
            } as any;
            this.cdr.markForCheck();
            this.calcularResumen(res || []);
          }
        });
    } else {
      const page = this.pageIndex;
      const size = this.pageSize;
      this.marcacionService.onGetJornadas(page, size)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.dataSource.data = res || [];
            this.selectedPageInfo = {
              getTotalElements: res ? res.length : 0,
              getContent: res || [],
              getTotalPages: 1
            } as any;
            this.cdr.markForCheck();
            this.calcularResumen(res || []);
          }
        });
    }
  }

  calcularResumen(jornadas: any[]): void {
    const uniqueDays = new Set(jornadas.map(j => j.fecha));
    this.diasTrabajados = uniqueDays.size;

    let totalMinutos = 0;
    let totalExtras = 0;
    let totalAtraso = 0;

    jornadas.forEach(j => {
      totalMinutos += j.minutosTrabajados || 0;
      totalExtras += j.minutosExtras || 0;
      totalAtraso += j.minutosLlegadaTardia || 0;
    });

    this.horasTrabajadas = this.formatMinutes(totalMinutos);
    this.horasExtras = this.formatMinutes(totalExtras);
    this.horasAtraso = this.formatMinutes(totalAtraso);

    if (this.fechaInicioControl.value) {
      const date = new Date(this.fechaInicioControl.value);
      this.mesResumen = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    }
  }

  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  resetearFiltro(): void {
    this.pageIndex = 0;
    this.pageSize = 15;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.usuarioIdControl.setValue(null);
    this.usuarioNombreControl.setValue(null);
    this.usuarioSeleccionado = null;
    this.inicializarFechas();
    this.turnoControl.setValue('TODOS');
    this.filtrar();
  }

  abrirBuscadorUsuario(): void {
    let data: SearchListtDialogData = {
      titulo: "Buscar Persona",
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        {
          id: "nombre",
          nombre: "Nombre",
          nested: true,
          nestedId: "persona",
          width: "50%",
        },
        {
          id: "documento",
          nombre: "Documento",
          nested: true,
          nestedId: "persona",
          width: "40%",
        },
      ],
      query: this.searchUsuario,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        height: "80vh",
        width: "70vw",
        panelClass: 'search-dialog-dark'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((usuario: Usuario) => {
        if (usuario) {
          this.seleccionarUsuario(usuario);
        }
      });
  }

  limpiarUsuario(): void {
    this.usuarioSeleccionado = null;
    this.usuarioNombreControl.setValue(null);
    this.usuarioIdControl.setValue(null);
    this.filtrar();
  }

  onAdicionarHorario(): void {
    const usuarioId = this.usuarioSeleccionado?.id || this.mainService.usuarioActual?.id;
    this.matDialog.open(AsignarHorarioDialogComponent, {
      width: '800px',
      data: { usuarioId: usuarioId }
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((result: any[]) => {
      if (result && result.length > 0) {
        result.forEach(h => {
          let horarioInput = new HorarioInput();
          horarioInput.id = h.id;
          horarioInput.horaEntrada = h.entrada;
          horarioInput.horaSalida = h.salida;
          horarioInput.usuarioId = this.usuarioSeleccionado?.id;
          horarioInput.dias = h.diasValue;
          horarioInput.turno = h.turnoValue;

          this.horarioService.onSaveHorario(horarioInput).subscribe(res => {
            if (res) {
              this.notificacionService.openSucess('Horario asignado correctamente');
            }
          });
        });
      }
    });
  }

  onGenerarPdf(): void {
    if (this.fechaFinControl.value == null) {
      this.fechaFinControl.setValue(this.hoy);
    }

    if (this.fechaInicioControl.value == null) {
      const unaSemanaAtras = new Date();
      unaSemanaAtras.setDate(this.fechaFinControl.value.getDate() - 7);
      this.fechaInicioControl.setValue(unaSemanaAtras);
    }

    const fechaInicio = this.fechaInicioControl.value
      ? dateToString(this.fechaInicioControl.value)
      : null;
    const fechaFin = this.fechaFinControl.value
      ? dateToString(this.fechaFinControl.value)
      : null;
    const usuarioId = this.usuarioSeleccionado?.id || null;

    this.marcacionService.onImprimirReporteMarcaciones(usuarioId, fechaInicio, fechaFin);
  }
}

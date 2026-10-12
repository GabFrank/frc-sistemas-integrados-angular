import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize } from 'rxjs/operators';
import { TransferenciaService } from '../transferencia.service';
import { Persona } from '../../../personas/persona/persona.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { VerificarParaTransporteInput } from '../transferencia.model';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { PersonaSearchPageGQL } from '../../../personas/persona/graphql/personaSearchPage';
import { Vehiculo } from '../../../activos/vehiculos/vehiculo/models/vehiculo.model';
import { VehiculoSearchPageGQL } from '../../../activos/vehiculos/vehiculo/graphql/vehiculoSearchPage';
import { UsuarioHelperService } from '../../../administrativo/marcacion/service/usuario-helper.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { AcompanhanteView } from '../ruta-hoja/ruta-hoja.component';

export interface VerificarTransporteDialogData {
  transferenciaId: number;
  /** Hoja que la transferencia ya tenia asignada desde la lista: de ahi se precargan vehiculo y acompañantes. */
  hojaRutaId?: number;
}

/**
 * Chofer, vehiculo y acompañantes antes de verificar para transporte. Mismo flujo que la PWA.
 *
 * El chofer elegido queda como responsable de la etapa, no quien tiene la sesion abierta: por eso se
 * elige un `Usuario` y el central toma su persona para la hoja de ruta, que crea siempre nueva.
 *
 * El dialogo hace la mutation el mismo y se cierra con `true` cuando hay que recargar la transferencia.
 * Si el central la rechaza queda abierto con lo cargado.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'verificar-transporte-dialog',
  templateUrl: './verificar-transporte-dialog.component.html',
  styleUrls: ['../ruta-hoja/ruta-hoja.component.scss', './verificar-transporte-dialog.component.scss']
})
export class VerificarTransporteDialogComponent implements OnInit {

  selectedChofer: Usuario;
  selectedVehiculo: Vehiculo;
  acompanhantes: Persona[] = [];

  // Estado de vista (precalculado, sin llamadas a funciones desde el HTML)
  vehiculoTitulo = '';
  vehiculoSubtitulo = '';
  choferTitulo = '';
  choferSubtitulo = '';
  choferIniciales = '';
  acompanhantesView: AcompanhanteView[] = [];
  cantidadAcompanhantes = 0;
  confirmarDeshabilitado = true;
  isLoading = false;
  isSaving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VerificarTransporteDialogData,
    public dialogRef: MatDialogRef<VerificarTransporteDialogComponent>,
    private transferenciaService: TransferenciaService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private usuarioHelperService: UsuarioHelperService,
    private vehiculoSearchPageGQL: VehiculoSearchPageGQL,
    private personaSearchPageGQL: PersonaSearchPageGQL
  ) { }

  ngOnInit(): void {
    if (this.data?.hojaRutaId) {
      this.precargarDesdeHoja(this.data.hojaRutaId);
    } else {
      this.actualizarResumen();
    }
  }

  /**
   * Solo ahorra tipeo: la hoja previa no se toca y al confirmar se crea una nueva. El chofer no se
   * precarga porque la hoja guarda una Persona y aca hace falta un Usuario. Si la hoja no carga se
   * arranca vacio.
   */
  private precargarDesdeHoja(id: number): void {
    this.isLoading = true;
    this.transferenciaService.onGetHojaRuta(id)
      .pipe(untilDestroyed(this), finalize(() => {
        this.isLoading = false;
        this.actualizarResumen();
      }))
      .subscribe({
        next: res => {
          if (res == null) return;
          this.selectedVehiculo = res.vehiculo;
          this.acompanhantes = res.acompanantes || [];
        },
        error: () => { }
      });
  }

  onBuscarChofer(): void {
    this.usuarioHelperService.abrirBuscador(this.matDialog, 'Buscar chofer')
      .pipe(untilDestroyed(this))
      .subscribe((res: Usuario) => {
        if (!res) return;
        if (res.persona?.id == null) {
          this.notificacionService.openWarn('Ese usuario no tiene una persona asociada y no puede figurar como chofer.');
          return;
        }
        this.selectedChofer = res;
        // Si ya figuraba como acompañante, deja de serlo: no puede ir dos veces.
        this.acompanhantes = this.acompanhantes.filter(p => p.id != res.persona.id);
        this.actualizarResumen();
      });
  }

  onBuscarVehiculo(): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'chapa', nombre: 'Chapa' },
      { id: 'modelo.marca.descripcion', nombre: 'Marca' },
      { id: 'modelo.descripcion', nombre: 'Modelo' }
    ];

    const data: SearchListtDialogData = {
      query: this.vehiculoSearchPageGQL,
      tableData,
      titulo: 'Buscar Vehículo',
      search: true,
      inicialSearch: true,
      textHint: 'Buscar por chapa, marca o modelo...',
      paginator: true,
      queryData: { page: 0, size: 15 }
    };

    this.matDialog.open(SearchListDialogComponent, {
      data,
      width: '70%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Vehiculo) => {
      if (res) {
        this.selectedVehiculo = res;
        this.actualizarResumen();
      }
    });
  }

  onAddAcompanhante(): void {
    const data: SearchListtDialogData = {
      query: this.personaSearchPageGQL,
      tableData: [
        { id: 'id', nombre: 'ID', width: '10%' },
        { id: 'nombre', nombre: 'Nombre' },
        { id: 'documento', nombre: 'Documento' }
      ],
      titulo: 'Buscar Acompañante',
      search: true,
      inicialSearch: true,
      textHint: 'Buscar por nombre o documento...',
      paginator: true,
      queryData: { page: 0, size: 15 }
    };

    this.matDialog.open(SearchListDialogComponent, {
      data,
      width: '70%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Persona) => {
      if (res) {
        if (this.selectedChofer?.persona?.id == res.id) {
          this.notificacionService.openWarn('Esta persona ya está asignada como chofer');
          return;
        }
        if (this.acompanhantes.find(p => p.id == res.id)) {
          this.notificacionService.openWarn('Esta persona ya esta agregada en la lista');
          return;
        }
        this.acompanhantes = [...this.acompanhantes, res];
        this.actualizarResumen();
      }
    });
  }

  onRemoveAcompanhante(item: AcompanhanteView): void {
    this.acompanhantes = this.acompanhantes.filter(p => p.id !== item.id);
    this.actualizarResumen();
  }

  onConfirmar(): void {
    if (this.confirmarDeshabilitado) return;

    this.dialogoService.confirm(
      'Atención, revise los datos antes de proceder.',
      this.choferTitulo + ' queda como chofer y responsable de la verificación para transporte.',
      'Estas iniciando la etapa de verificación de productos para su transporte'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res) this.verificar();
    });
  }

  private verificar(): void {
    const input = new VerificarParaTransporteInput();
    input.transferenciaId = this.data.transferenciaId;
    input.choferUsuarioId = this.selectedChofer.id;
    input.vehiculoId = this.selectedVehiculo.id;
    input.acompanantesIds = this.acompanhantes.map(p => p.id);

    this.isSaving = true;
    this.actualizarResumen();
    this.transferenciaService.onVerificarParaTransporte(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: err => {
          // Sin respuesta, la etapa pudo haber avanzado igual: se cierra y la pantalla recarga la
          // transferencia para mostrar como quedo. Un rechazo ya fue avisado: queda abierto.
          if (erroresDeRechazo(err) == null) {
            this.dialogRef.close(true);
            return;
          }
          this.isSaving = false;
          this.actualizarResumen();
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  trackByAcompanhante(index: number, item: AcompanhanteView): number {
    return item.id;
  }

  /**
   * Recalcula todo lo que consume el template. Se llama solo ante cambios reales
   * de estado para evitar evaluaciones en cada ciclo de change detection.
   */
  private actualizarResumen(): void {
    const marca = this.selectedVehiculo?.modelo?.marca?.descripcion;
    const modelo = this.selectedVehiculo?.modelo?.descripcion;
    this.vehiculoTitulo = this.selectedVehiculo
      ? [marca, modelo].filter(v => !!v).join(' ') || `Vehículo ${this.selectedVehiculo.id}`
      : '';
    this.vehiculoSubtitulo = this.selectedVehiculo?.chapa
      ? `Chapa ${this.selectedVehiculo.chapa}`
      : '';

    const nombreChofer = this.selectedChofer?.persona?.nombre || this.selectedChofer?.nickname;
    this.choferTitulo = nombreChofer ? nombreChofer.toUpperCase() : '';
    this.choferSubtitulo = this.selectedChofer?.nickname
      ? `Usuario ${this.selectedChofer.nickname}`
      : '';
    this.choferIniciales = this.getIniciales(nombreChofer);

    this.acompanhantesView = this.acompanhantes.map(p => ({
      id: p.id,
      nombre: (p.nombre || '').toUpperCase(),
      documento: p.documento || '',
      iniciales: this.getIniciales(p.nombre),
      persona: p
    }));
    this.cantidadAcompanhantes = this.acompanhantesView.length;

    this.confirmarDeshabilitado = this.isSaving
      || this.isLoading
      || this.selectedVehiculo == null
      || this.selectedChofer == null;
  }

  private getIniciales(nombre: string): string {
    if (!nombre) return '?';
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase();
  }
}

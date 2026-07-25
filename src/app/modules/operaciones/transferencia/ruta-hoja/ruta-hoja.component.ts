import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize } from 'rxjs/operators';
import { TransferenciaService } from '../transferencia.service';
import { Persona } from '../../../personas/persona/persona.model';
import { HojaRuta, HojaRutaInput } from '../transferencia.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { PersonaSearchPageGQL } from '../../../personas/persona/graphql/personaSearchPage';
import { Vehiculo } from '../../../activos/vehiculos/vehiculo/models/vehiculo.model';
import { VehiculoSearchPageGQL } from '../../../activos/vehiculos/vehiculo/graphql/vehiculoSearchPage';

/**
 * Vista precalculada de cada acompañante.
 * Se arma en el .ts para no llamar funciones/getters desde el template.
 */
export interface AcompanhanteView {
  id: number;
  nombre: string;
  documento: string;
  iniciales: string;
  persona: Persona;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'ruta-hoja',
  templateUrl: './ruta-hoja.component.html',
  styleUrls: ['./ruta-hoja.component.scss']
})
export class RutaHojaComponent implements OnInit {

  fechaSalidaControl = new FormControl(new Date());

  selectedVehiculo: Vehiculo;
  selectedChofer: Persona;
  selectedHojaRuta: HojaRuta;
  acompanhantes: Persona[] = [];

  // Estado de vista (precalculado, sin llamadas a funciones desde el HTML)
  tituloDialog = 'Nueva hoja de ruta';
  subtituloDialog = 'Asigná el vehículo y la tripulación de la ruta';
  vehiculoTitulo = '';
  vehiculoSubtitulo = '';
  choferTitulo = '';
  choferSubtitulo = '';
  choferIniciales = '';
  acompanhantesView: AcompanhanteView[] = [];
  cantidadAcompanhantes = 0;
  guardarDeshabilitado = true;
  isLoading = false;
  isSaving = false;

  private readonly personaTableData: TableData[] = [
    { id: 'id', nombre: 'ID', width: '10%' },
    { id: 'nombre', nombre: 'Nombre' },
    { id: 'documento', nombre: 'Documento' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<RutaHojaComponent>,
    private transferenciaService: TransferenciaService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private vehiculoSearchPageGQL: VehiculoSearchPageGQL,
    private personaSearchPageGQL: PersonaSearchPageGQL
  ) { }

  ngOnInit(): void {
    if (this.data?.hojaRutaId) {
      this.loadHojaRuta(this.data.hojaRutaId);
    } else {
      this.actualizarResumen();
    }
  }

  loadHojaRuta(id: number): void {
    this.isLoading = true;
    this.transferenciaService.onGetHojaRuta(id)
      .pipe(untilDestroyed(this), finalize(() => this.isLoading = false))
      .subscribe(res => {
        if (res) {
          this.selectedHojaRuta = res;
          this.selectedVehiculo = res.vehiculo;
          this.selectedChofer = res.chofer;
          if (res.fechaSalida) {
            this.fechaSalidaControl.setValue(new Date(res.fechaSalida));
          }
          this.acompanhantes = res.acompanantes || [];
        }
        this.isLoading = false;
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

  onBuscarChofer(): void {
    const data: SearchListtDialogData = {
      query: this.personaSearchPageGQL,
      tableData: this.personaTableData,
      titulo: 'Buscar Chofer',
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
        this.selectedChofer = res;
        this.actualizarResumen();
      }
    });
  }

  onAddAcompanhante(): void {
    const data: SearchListtDialogData = {
      query: this.personaSearchPageGQL,
      tableData: this.personaTableData,
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
        if (this.selectedChofer?.id === res.id) {
          this.notificacionService.openWarn('Esta persona ya está asignada como chofer');
          return;
        }
        if (this.acompanhantes.find(p => p.id === res.id)) {
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

  onSave(): void {
    if (this.guardarDeshabilitado) return;

    const input = new HojaRutaInput();
    input.id = this.selectedHojaRuta?.id;
    input.vehiculoId = this.selectedVehiculo.id;
    input.choferId = this.selectedChofer.id;
    input.fechaSalida = dateToString(this.fechaSalidaControl.value);
    input.acompanantesIds = this.acompanhantes.map(p => p.id);

    this.isSaving = true;
    this.guardarDeshabilitado = true;
    this.transferenciaService.onSaveHojaRuta(input)
      .pipe(untilDestroyed(this), finalize(() => this.isSaving = false))
      .subscribe({
        next: res => {
          if (res) {
            this.dialogRef.close(res);
          } else {
            this.isSaving = false;
            this.actualizarResumen();
          }
        },
        error: err => {
          console.error('Error al guardar la hoja de ruta:', err);
          this.isSaving = false;
          this.notificacionService.openWarn('No se pudo guardar la hoja de ruta');
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
    this.tituloDialog = this.selectedHojaRuta?.id
      ? `Hoja de ruta #${this.selectedHojaRuta.id}`
      : 'Nueva hoja de ruta';

    const marca = this.selectedVehiculo?.modelo?.marca?.descripcion;
    const modelo = this.selectedVehiculo?.modelo?.descripcion;
    this.vehiculoTitulo = this.selectedVehiculo
      ? [marca, modelo].filter(v => !!v).join(' ') || `Vehículo ${this.selectedVehiculo.id}`
      : '';
    this.vehiculoSubtitulo = this.selectedVehiculo?.chapa
      ? `Chapa ${this.selectedVehiculo.chapa}`
      : '';

    this.choferTitulo = this.selectedChofer?.nombre ? this.selectedChofer.nombre.toUpperCase() : '';
    this.choferSubtitulo = this.selectedChofer?.documento
      ? `Doc. ${this.selectedChofer.documento}`
      : '';
    this.choferIniciales = this.getIniciales(this.selectedChofer?.nombre);

    this.acompanhantesView = this.acompanhantes.map(p => ({
      id: p.id,
      nombre: (p.nombre || '').toUpperCase(),
      documento: p.documento || '',
      iniciales: this.getIniciales(p.nombre),
      persona: p
    }));
    this.cantidadAcompanhantes = this.acompanhantesView.length;

    this.guardarDeshabilitado = this.isSaving
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

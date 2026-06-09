import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { EnteArchivo } from '../../../ente/models/ente-archivo.model';
import { TipoArchivoEnte } from '../../../ente/enums/tipo-archivo-ente.enum';
import { EnteArchivoService } from '../../../ente/service/ente-archivo.service';
import { EnteDocumentoService } from '../../services/ente-documento.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { MainService } from '../../../../../main.service';

export interface TipoArchivoOpcion {
  tipo: TipoArchivoEnte;
  etiqueta: string;
}

interface ArchivoPendiente {
  nombre: string;
  tipo: TipoArchivoEnte;
  contenidoBase64: string;
}

interface ArchivoTablaRow extends EnteArchivo {
  etiquetaTipo: string;
}

interface ArchivoPendienteRow extends ArchivoPendiente {
  etiquetaTipo: string;
}

@Component({
  selector: 'app-ente-archivos-panel',
  templateUrl: './ente-archivos-panel.component.html',
  styleUrls: ['./ente-archivos-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnteArchivosPanelComponent implements OnChanges {
  private enteArchivoService = inject(EnteArchivoService);
  private documentoService = inject(EnteDocumentoService);
  private notificacion = inject(NotificacionSnackbarService);
  private mainService = inject(MainService);
  private cdr = inject(ChangeDetectorRef);

  @Input() enteId: number | null = null;
  @Input() tiposPermitidos: TipoArchivoOpcion[] = [];

  archivos: ArchivoTablaRow[] = [];
  archivosPendientes: ArchivoPendienteRow[] = [];
  cargando = false;
  subiendo = false;
  tipoSeleccionado: TipoArchivoEnte | null = null;
  archivoAmpliado = false;
  contenidoAmpliado: string | null = null;
  tituloAmpliado = 'Archivo';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enteId']) {
      const anterior = changes['enteId'].previousValue as number | null;
      const actual = changes['enteId'].currentValue as number | null;
      if (actual) {
        this.cargarArchivos();
        if (!anterior && this.archivosPendientes.length) {
          this.subirPendientes();
        }
      } else {
        this.archivos = [];
        this.cdr.markForCheck();
      }
    }
    if (changes['tiposPermitidos'] && this.tiposPermitidos?.length) {
      this.tipoSeleccionado = this.tiposPermitidos[0].tipo;
      this.actualizarEtiquetasArchivos();
    }
  }

  cargarArchivos(): void {
    if (!this.enteId) {
      this.archivos = [];
      this.cdr.markForCheck();
      return;
    }
    this.cargando = true;
    this.enteArchivoService.listarPorEnte(this.enteId).subscribe({
      next: (lista) => {
        this.archivos = (lista || []).map(archivo => this.mapearArchivo(archivo));
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  async onSeleccionarArchivo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!this.tipoSeleccionado) {
      this.notificacion.openWarn('Seleccione un tipo de archivo.');
      return;
    }

    this.subiendo = true;
    this.cdr.markForCheck();
    try {
      const contenidoBase64 = await this.documentoService.leerArchivoComoBase64(file);
      if (!this.enteId) {
        this.archivosPendientes = [
          ...this.archivosPendientes,
          this.mapearArchivoPendiente({
            nombre: file.name,
            tipo: this.tipoSeleccionado,
            contenidoBase64,
          }),
        ];
        this.subiendo = false;
        this.notificacion.openSucess('Archivo agregado. Se subirá al guardar el registro.');
        this.cdr.markForCheck();
        return;
      }

      try {
        await this.guardarArchivo(file.name, this.tipoSeleccionado, contenidoBase64);
        this.notificacion.openSucess('Archivo cargado correctamente');
        this.cargarArchivos();
      } catch {
        this.notificacion.openWarn('No se pudo registrar el archivo');
      } finally {
        this.subiendo = false;
        this.cdr.markForCheck();
      }
    } catch {
      this.subiendo = false;
      this.notificacion.openWarn('No se pudo leer el archivo');
      this.cdr.markForCheck();
    }
  }

  quitarPendiente(indice: number): void {
    this.archivosPendientes = this.archivosPendientes.filter((_, i) => i !== indice);
    this.cdr.markForCheck();
  }

  private async subirPendientes(): Promise<void> {
    if (!this.enteId || !this.archivosPendientes.length) {
      return;
    }
    const pendientes = [...this.archivosPendientes];
    this.archivosPendientes = [];
    this.subiendo = true;
    this.cdr.markForCheck();

    let exitosos = 0;
    for (const pendiente of pendientes) {
      try {
        await this.guardarArchivo(pendiente.nombre, pendiente.tipo, pendiente.contenidoBase64);
        exitosos++;
      } catch {
        this.archivosPendientes.push(pendiente);
      }
    }

    this.subiendo = false;
    if (exitosos > 0) {
      this.notificacion.openSucess(
        exitosos === 1 ? 'Archivo cargado correctamente' : `${exitosos} archivos cargados correctamente`
      );
      this.cargarArchivos();
    }
    if (this.archivosPendientes.length) {
      this.notificacion.openWarn('Algunos archivos no se pudieron subir');
    }
    this.cdr.markForCheck();
  }

  private guardarArchivo(nombre: string, tipo: TipoArchivoEnte, contenidoBase64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.enteArchivoService.guardar({
        enteId: this.enteId!,
        tipoArchivo: tipo,
        nombreArchivo: nombre,
        contenidoBase64,
        descripcion: nombre,
        vigente: true,
        usuarioId: this.mainService.usuarioActual?.id,
      }).subscribe({
        next: () => resolve(),
        error: () => reject(),
      });
    });
  }

  abrirArchivo(archivo: EnteArchivo): void {
    const url = archivo?.url?.trim();
    if (!url) {
      this.notificacion.openWarn('No hay referencia al archivo');
      return;
    }

    if (this.documentoService.esUrlExterna(url)) {
      this.notificacion.openWarn('Este archivo usa almacenamiento externo. Vuelva a subirlo para guardarlo en el servidor local.');
      return;
    }

    const localUrl = this.documentoService.urlDocumentoLocal(url);
    if (this.documentoService.esImagenPorNombre(url)) {
      this.contenidoAmpliado = localUrl;
      this.tituloAmpliado = archivo.descripcion || 'Archivo';
      this.archivoAmpliado = true;
      this.cdr.markForCheck();
      return;
    }

    window.open(localUrl, '_blank');
  }

  cerrarArchivoAmpliado(): void {
    this.archivoAmpliado = false;
    this.contenidoAmpliado = null;
  }

  private mapearArchivo(archivo: EnteArchivo): ArchivoTablaRow {
    return {
      ...archivo,
      etiquetaTipo: this.resolverEtiquetaTipo(archivo.tipoArchivo),
    };
  }

  private mapearArchivoPendiente(archivo: ArchivoPendiente): ArchivoPendienteRow {
    return {
      ...archivo,
      etiquetaTipo: this.resolverEtiquetaTipo(archivo.tipo),
    };
  }

  private actualizarEtiquetasArchivos(): void {
    this.archivos = this.archivos.map(archivo => this.mapearArchivo(archivo));
    this.archivosPendientes = this.archivosPendientes.map(archivo => this.mapearArchivoPendiente(archivo));
  }

  private resolverEtiquetaTipo(tipo: TipoArchivoEnte): string {
    return this.tiposPermitidos.find(t => t.tipo === tipo)?.etiqueta || tipo;
  }
}

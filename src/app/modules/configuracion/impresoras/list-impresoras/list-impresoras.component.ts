import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import {
  Impresora,
  PerfilPapel,
  TipoConexion,
  TipoImpresora,
} from '../impresora.model';
import { ImpresoraService } from '../impresora.service';
import { AdicionarImpresoraDialogComponent } from '../adicionar-impresora-dialog/adicionar-impresora-dialog.component';
import { AgregarDesdeSucursalDialogComponent } from '../agregar-desde-sucursal-dialog/agregar-desde-sucursal-dialog.component';
import { ElectronService } from '../../../../commons/core/electron/electron.service';

interface ImpresoraVista {
  ref: Impresora;
  nombre: string;
  iconoTipo: string;
  tipoLabel: string;
  usoLabel: string;
  iconoConexion: string;
  conexionDetalle: string;
  perfil: string;
  activo: boolean;
  esPredeterminada: boolean;
  sucursalNombre: string;
  colorIndex: number;
  compartidaEnCentral: boolean;
}

const PERFIL_LABEL: Record<PerfilPapel, string> = {
  MM_48: '48 mm',
  MM_58: '58 mm',
  MM_72: '72 mm',
  MM_80: '80 mm',
  A4: 'A4',
  CARTA: 'Carta',
  CUSTOM: 'Personalizado',
};

const TIPO_ICONO: Record<TipoImpresora, string> = {
  TERMICA: 'receipt_long',
  NORMAL: 'print',
  ETIQUETA: 'label',
};

const TIPO_LABEL: Record<TipoImpresora, string> = {
  TERMICA: 'Térmica',
  NORMAL: 'Normal',
  ETIQUETA: 'Etiqueta',
};

const CONEXION_ICONO: Record<TipoConexion, string> = {
  CUPS: 'cable',
  USB: 'usb',
  RED: 'wifi',
  BLUETOOTH: 'bluetooth',
};

@UntilDestroy()
@Component({
  selector: 'app-list-impresoras',
  templateUrl: './list-impresoras.component.html',
  styleUrls: ['./list-impresoras.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListImpresorasComponent implements OnInit {

  private impresoraService = inject(ImpresoraService);
  private matDialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private notificacion = inject(NotificacionSnackbarService);
  private electronService = inject(ElectronService);

  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;

  impresoras: ImpresoraVista[] = [];
  filas: (ImpresoraVista | null)[][] = [];
  columnas = 3;
  cargando = false;
  total = 0;
  
  page = 0;
  size = 20;
  isLastPage = false;
  
  searchControl = new FormControl('');

  ngOnInit(): void {
    this.calcularColumnas();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.recargar();
      });

    this.cargar();
  }

  recargar(): void {
    this.page = 0;
    this.impresoras = [];
    this.filas = [];
    this.isLastPage = false;
    this.cargar();
  }

  cargar(): void {
    if (this.cargando || this.isLastPage) return;
    
    this.cargando = true;
    this.cdr.markForCheck();
    
    const texto = this.searchControl.value || '';
    
    this.impresoraService.buscarConPagina(texto, this.page, this.size)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        const lista = res?.content ?? [];
        this.total = res?.totalElements ?? 0;
        
        const nuevasVistas = lista.map((i) => this.aVista(i));
        this.impresoras = [...this.impresoras, ...nuevasVistas];
        this.filas = this.chunkArray(this.impresoras, this.columnas);
        
        if (this.impresoras.length >= this.total || lista.length === 0) {
          this.isLastPage = true;
        }
        
        this.page++;
        this.cargando = false;
        this.cdr.markForCheck();
      });
  }

  nextBatch(e: number, offset: number): void {
    if (this.isLastPage) {
      return;
    }
    const end = this.viewport.getRenderedRange().end;
    const total = this.viewport.getDataLength();
    if (end >= total - offset) {
      this.cargar();
    }
  }

  agregarNuevo(): void {
    this.matDialog
      .open(AdicionarImpresoraDialogComponent, { data: {}, width: '640px', disableClose: true })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.recargar();
        }
      });
  }

  agregarDesdeSucursal(): void {
    this.matDialog
      .open(AgregarDesdeSucursalDialogComponent, { width: '640px', disableClose: true })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res === true) {
          this.recargar();
        }
      });
  }

  editarItem(impresora: Impresora): void {
    this.matDialog
      .open(AdicionarImpresoraDialogComponent, { data: { impresora }, width: '640px', disableClose: true })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.recargar();
        }
      });
  }

  eliminarItem(impresora: Impresora): void {
    this.impresoraService.eliminar(impresora.id)
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) {
          this.recargar();
        }
      });
  }

  probar(impresora: Impresora): void {
    // El ticket de prueba se intenta primero 100% en el frontend (Electron): el ESC/POS lo arma
    // Electron con los datos de la impresora y lo manda a la impresora local a esta PC (RED por
    // socket TCP, CUPS/USB por `lp -d <cola> -o raw`). Si esa cola no existe en esta PC (típico de
    // una impresora agregada vía "Agregar desde sucursal", que vive en el CUPS de otro host), se
    // reintenta por el backend (`PrintRouterService`), que rutea al host dueño de la impresora.
    if (!this.electronService.isElectron) {
      this.probarPorBackend(impresora);
      return;
    }
    this.electronService.printTestLocal({
      conexion: impresora.conexion,
      cola: impresora.colaCups,
      ip: impresora.ip,
      puerto: impresora.puerto,
      nombre: impresora.nombre,
      sucursal: impresora.sucursal?.nombre,
      columnas: impresora.columnas,
      perfil: impresora.perfilPapel,
    })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.notificarEnviado(impresora);
          } else {
            this.probarPorBackend(impresora);
          }
        },
        error: () => this.probarPorBackend(impresora),
      });
  }

  /** Respaldo de "Probar" vía backend, para impresoras que no viven físicamente en esta PC. */
  private probarPorBackend(impresora: Impresora): void {
    this.impresoraService.probarEnBackend(impresora.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          if (ok) {
            this.notificarEnviado(impresora);
          } else {
            this.notificarFallo(impresora, 'verificá que la sucursal esté online y la cola exista');
          }
        },
        error: (e) => this.notificarFallo(impresora, e?.message),
      });
  }

  private notificarEnviado(impresora: Impresora): void {
    this.notificacion.notification$.next({
      texto: 'Ticket de prueba enviado a ' + impresora.nombre,
      color: NotificacionColor.success,
      duracion: 3,
    });
  }

  private notificarFallo(impresora: Impresora, detalle?: string): void {
    this.notificacion.notification$.next({
      texto: 'No se pudo imprimir en ' + impresora.nombre + (detalle ? ': ' + detalle : ''),
      color: NotificacionColor.warn,
      duracion: 4,
    });
  }

  private aVista(i: Impresora): ImpresoraVista {
    const sucursalId = i?.sucursal?.id ?? 0;
    return {
      ref: i,
      nombre: i?.nombre,
      iconoTipo: i?.tipo ? TIPO_ICONO[i.tipo] : 'print',
      tipoLabel: i?.tipo ? TIPO_LABEL[i.tipo] : '',
      usoLabel: i?.uso ?? '',
      iconoConexion: i?.conexion ? CONEXION_ICONO[i.conexion] : 'print',
      conexionDetalle: this.detalleConexion(i),
      perfil: i?.perfilPapel ? PERFIL_LABEL[i.perfilPapel] : '',
      activo: i?.activo === true,
      esPredeterminada: i?.esPredeterminada === true,
      sucursalNombre: i?.sucursal ? `${i.sucursal.id} - ${i.sucursal.nombre}` : 'Sin sucursal',
      colorIndex: sucursalId % 6,
      compartidaEnCentral: i?.compartidaEnCentral === true,
    };
  }

  private detalleConexion(i: Impresora): string {
    if (i?.conexion === 'RED') {
      const puerto = i?.puerto ?? 9100;
      return `${i?.ip ?? ''}:${puerto}`;
    }
    return i?.colaCups ?? (i?.conexion ?? '');
  }

  @HostListener('window:resize')
  onResize() {
    this.calcularColumnas();
  }

  private calcularColumnas() {
    // Estimación del ancho del contenedor (viewport width - aprox sidebar y paddings)
    const sidebarWidth = 250; 
    const padding = 60;
    const availableWidth = window.innerWidth - sidebarWidth - padding;
    const minCardWidth = 320;
    const gap = 16;
    
    let newColumnas = Math.floor((availableWidth + gap) / (minCardWidth + gap));
    if (newColumnas < 1) newColumnas = 1;
    
    if (this.columnas !== newColumnas) {
      this.columnas = newColumnas;
      this.filas = this.chunkArray(this.impresoras, this.columnas);
      this.cdr.markForCheck();
    }
  }

  private chunkArray(array: ImpresoraVista[], size: number): (ImpresoraVista | null)[][] {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      const chunk: (ImpresoraVista | null)[] = array.slice(i, i + size);
      while (chunk.length < size) {
        chunk.push(null);
      }
      result.push(chunk);
    }
    return result;
  }
}

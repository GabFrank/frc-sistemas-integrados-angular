import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
}

interface GrupoSucursal {
  sucursalNombre: string;
  impresoras: ImpresoraVista[];
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

  grupos: GrupoSucursal[] = [];
  cargando = false;
  total = 0;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.cdr.markForCheck();
    this.impresoraService.todas(0, 300)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        const lista = res ?? [];
        this.total = lista.length;
        this.grupos = this.agrupar(lista.map((i) => this.aVista(i)));
        this.cargando = false;
        this.cdr.markForCheck();
      });
  }

  agregarNuevo(): void {
    this.matDialog
      .open(AdicionarImpresoraDialogComponent, { data: {}, width: '640px', disableClose: true })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.cargar();
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
          this.cargar();
        }
      });
  }

  eliminarItem(impresora: Impresora): void {
    this.impresoraService.eliminar(impresora.id)
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) {
          this.cargar();
        }
      });
  }

  probar(impresora: Impresora): void {
    this.impresoraService.probar(impresora.id)
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) {
          this.notificacion.notification$.next({
            texto: 'Ticket de prueba enviado a ' + impresora.nombre,
            color: NotificacionColor.success,
            duracion: 3,
          });
        } else {
          this.notificacion.notification$.next({
            texto: 'No se pudo imprimir en ' + impresora.nombre,
            color: NotificacionColor.warn,
            duracion: 4,
          });
        }
      });
  }

  private agrupar(vistas: ImpresoraVista[]): GrupoSucursal[] {
    const mapa = new Map<string, ImpresoraVista[]>();
    for (const v of vistas) {
      const clave = v.ref?.sucursal
        ? `${v.ref.sucursal.id} - ${v.ref.sucursal.nombre}`
        : 'Sin sucursal asignada';
      if (!mapa.has(clave)) {
        mapa.set(clave, []);
      }
      mapa.get(clave).push(v);
    }
    const grupos: GrupoSucursal[] = [];
    mapa.forEach((impresoras, sucursalNombre) => {
      grupos.push({ sucursalNombre, impresoras });
    });
    return grupos;
  }

  private aVista(i: Impresora): ImpresoraVista {
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
    };
  }

  private detalleConexion(i: Impresora): string {
    if (i?.conexion === 'RED') {
      const puerto = i?.puerto ?? 9100;
      return `${i?.ip ?? ''}:${puerto}`;
    }
    return i?.colaCups ?? (i?.conexion ?? '');
  }
}

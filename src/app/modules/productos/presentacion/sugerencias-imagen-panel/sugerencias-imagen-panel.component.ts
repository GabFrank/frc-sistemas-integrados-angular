import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscription, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CortarImagenDialogComponent } from '../../../../shared/cortar-imagen-dialog/cortar-imagen-dialog.component';
import { Producto } from '../../producto/producto.model';
import { ImagenSugerida, SugerenciasImagen } from '../imagen-sugerida.model';
import { Presentacion } from '../presentacion.model';
import { PresentacionService } from '../presentacion.service';

export interface SugerenciasImagenPanelData {
  presentacion: Presentacion;
  producto: Producto;
}

/** Lo que pinta cada miniatura, calculado una vez (nada de funciones en el template). */
interface VistaImagen extends ImagenSugerida {
  tamano: string;
  esExacta: boolean;
  oculta: boolean;
}

/** Diálogo pegado al borde derecho, a alto completo: deja ver la tabla de presentaciones detrás. */
export const SUGERENCIAS_IMAGEN_PANEL_CONFIG: MatDialogConfig = {
  panelClass: 'sugerencias-imagen-panel',
  position: { right: '0', top: '0' },
  height: '100vh',
  width: '560px',
  maxWidth: '100vw',
  autoFocus: false,
};

/**
 * Fotos de internet para una presentación, por código de barras y por descripción. La búsqueda y la
 * descarga las hace el central; la foto elegida pasa por el recorte y se guarda igual que una subida a mano.
 * Cierra con la foto guardada (data URL) o null.
 */
@UntilDestroy()
@Component({
  selector: 'app-sugerencias-imagen-panel',
  templateUrl: './sugerencias-imagen-panel.component.html',
  styleUrls: ['./sugerencias-imagen-panel.component.scss'],
})
export class SugerenciasImagenPanelComponent implements OnInit {

  form = new FormGroup({
    codigo: new FormControl<string>(null),
    texto: new FormControl<string>(null),
  });

  buscando = false;
  error: string = null;
  resultado: SugerenciasImagen = null;
  porCodigo: VistaImagen[] = [];
  porDescripcion: VistaImagen[] = [];
  sinResultados = false;

  seleccionada: VistaImagen = null;
  previewSrc: string = null;
  descargando = false;
  errorDescarga: string = null;

  private busqueda: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SugerenciasImagenPanelData,
    private dialogRef: MatDialogRef<SugerenciasImagenPanelComponent, string>,
    private matDialog: MatDialog,
    private presentacionService: PresentacionService,
    private notificacionService: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    // La primera vez el central elige el código y arma el texto; después mandan los campos.
    this.buscar(true);
  }

  buscar(inicial = false): void {
    const codigo = inicial ? undefined : (this.form.value.codigo ?? '').trim();
    const texto = inicial ? undefined : (this.form.value.texto ?? '').trim() || undefined;
    this.busqueda?.unsubscribe();
    this.buscando = true;
    this.error = null;
    this.limpiarSeleccion();
    this.busqueda = this.presentacionService
      .onGetSugerenciasImagen(this.data.presentacion.id, codigo, texto)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.buscando = false;
          if (res == null) {
            this.error = 'El servidor no devolvió sugerencias.';
            return;
          }
          this.resultado = res;
          this.form.patchValue({ codigo: res.codigo ?? res.codigoDescartado ?? '', texto: res.texto }, { emitEvent: false });
          this.porCodigo = res.porCodigo.map((i) => this.vista(i, true));
          this.porDescripcion = res.porDescripcion.map((i) => this.vista(i, false));
          this.sinResultados = this.porCodigo.length + this.porDescripcion.length === 0;
        },
        error: (e) => {
          this.buscando = false;
          this.error = e?.message ? `No se pudo buscar: ${e.message}` : 'No se pudo buscar. Revisá la conexión con el servidor.';
        },
      });
  }

  seleccionar(img: VistaImagen): void {
    this.seleccionada = img;
    this.previewSrc = img.url;
    this.errorDescarga = null;
  }

  limpiarSeleccion(): void {
    this.seleccionada = null;
    this.previewSrc = null;
    this.errorDescarga = null;
  }

  /** La miniatura no carga (el sitio bloquea el enlace o la borró): se saca de la grilla. */
  onMiniaturaError(img: VistaImagen): void {
    img.oculta = true;
  }

  /** La foto grande no deja verse directo: se muestra la miniatura; la descarga la intenta igual el central. */
  onPreviewError(): void {
    if (this.seleccionada != null && this.previewSrc !== this.seleccionada.miniatura) {
      this.previewSrc = this.seleccionada.miniatura;
    }
  }

  usar(): void {
    const img = this.seleccionada;
    if (img == null || this.descargando) return;
    this.descargando = true;
    this.errorDescarga = null;
    let usoMiniatura = false;
    this.descargar(img.url)
      .pipe(
        // El sitio no entrega el original (403, no es imagen, muy pesado): la miniatura es mejor que nada.
        catchError((e) => {
          if (img.miniatura === img.url) return throwError(() => e);
          usoMiniatura = true;
          return this.descargar(img.miniatura);
        }),
        untilDestroyed(this)
      )
      .subscribe({
        next: (base64) => {
          this.descargando = false;
          if (usoMiniatura) {
            this.notificacionService.openWarn('El sitio no entregó la foto original: se usa una versión más chica.', 5);
          }
          this.recortarYGuardar(base64);
        },
        error: (e) => {
          this.descargando = false;
          this.errorDescarga = e?.message ?? 'No se pudo bajar la imagen. Probá con otra.';
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close(null);
  }

  private descargar(url: string): Observable<string> {
    return this.presentacionService.onDescargarImagenSugerida(url).pipe(
      switchMap((b64) => (b64 ? of(b64) : throwError(() => ({ message: 'El servidor no devolvió la imagen.' }))))
    );
  }

  private recortarYGuardar(base64: string): void {
    this.matDialog
      .open(CortarImagenDialogComponent, {
        data: { imagenBase64: base64 },
        width: '50%',
        height: '50%',
      })
      .afterClosed()
      .pipe(
        switchMap((recortada: string) =>
          recortada == null
            ? of(null)
            : this.presentacionService
                .onImageSave(recortada, `${this.data.presentacion.id}.jpg`)
                .pipe(tap((ok) => { if (ok) this.dialogRef.close(recortada); }))
        ),
        untilDestroyed(this)
      )
      .subscribe();
  }

  private vista(i: ImagenSugerida, porCodigo: boolean): VistaImagen {
    return {
      ...i,
      tamano: i.ancho && i.alto ? `${i.ancho}×${i.alto}` : '',
      esExacta: porCodigo && i.fuente === 'OPEN_FOOD_FACTS',
      oculta: false,
    };
  }
}

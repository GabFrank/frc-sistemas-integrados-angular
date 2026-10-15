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
  /** Solo para el encabezado. */
  producto?: Producto;
}

/** Lo que pinta cada miniatura, calculado una vez (nada de funciones en el template). */
interface VistaImagen extends ImagenSugerida {
  tamano: string;
  esExacta: boolean;
  oculta: boolean;
}

/** Lo que hay en pantalla antes de «Buscar parecidas», para volver sin buscar de nuevo. */
interface BusquedaAnterior {
  codigo: string;
  texto: string;
  resultado: SugerenciasImagen;
  porCodigo: VistaImagen[];
  porPack: VistaImagen[];
  porDescripcion: VistaImagen[];
  parecidas: VistaImagen[];
  tituloParecidas: string;
}

/**
 * El título de la página de la foto, para que el central la ubique en Brave: sin el sitio («… | CASA YUGOVICH»,
 * «… - Rappi»), emojis ni puntos suspensivos, y hasta 10 palabras (Bing busca peor con más).
 * Vacío si no queda nada que buscar.
 */
export function textoDeTitulo(titulo: string): string {
  let s = (titulo ?? '').replace(/[^\p{L}\p{N}\s.,/()%×|–—-]/gu, ' ').replace(/\.{2,}|…/g, ' ').trim();
  const corte = s.search(/\s[|–—-]\s/);
  if (corte > 0 && s.slice(0, corte).trim().split(/\s+/).length >= 2) s = s.slice(0, corte);
  const palabras = s.replace(/[|–—]/g, ' ').trim().split(/\s+/);
  // Una sola palabra suele ser el nombre de la tienda («Baratote»), no el producto.
  return palabras.length >= 2 ? palabras.slice(0, 10).join(' ') : '';
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
  porPack: VistaImagen[] = [];
  porDescripcion: VistaImagen[] = [];
  /** Resultado de «Buscar parecidas» visual (Brave); mientras hay, las otras listas están vacías. */
  parecidas: VistaImagen[] = [];
  tituloParecidas = '';
  /** Hay una búsqueda de parecidas en pantalla y se puede volver a la de antes. */
  anterior: BusquedaAnterior = null;
  sinResultados = false;

  seleccionada: VistaImagen = null;
  /** El título limpio de la seleccionada: con él el central la ubica en Brave o, si Brave no responde, busca en Bing. */
  textoParecidas = '';
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
          this.porCodigo = res.porCodigo.map((i) => this.vista(i));
          this.porPack = (res.porPack ?? []).map((i) => this.vista(i));
          this.porDescripcion = res.porDescripcion.map((i) => this.vista(i));
          this.parecidas = [];
          this.actualizarSinResultados();
        },
        error: (e) => {
          this.buscando = false;
          this.error = e?.message ? `No se pudo buscar: ${e.message}` : 'No se pudo buscar. Revisá la conexión con el servidor.';
        },
      });
  }

  seleccionar(img: VistaImagen): void {
    this.seleccionada = img;
    this.textoParecidas = textoDeTitulo(img.titulo);
    this.previewSrc = img.url;
    this.errorDescarga = null;
  }

  /**
   * Fotos parecidas a la elegida. El central prueba Brave visual (con su ruta de parecidas o ubicándola por
   * el título; `aproximada` si no está) y, si Brave no responde, Bing con el título (`porTexto`): siempre
   * trae algo. Se descarta lo que ya estaba en pantalla, para no repetir la lista.
   */
  buscarParecidas(): void {
    const img = this.seleccionada;
    if (img == null || this.buscando) return;
    if (this.resultado != null) {
      this.anterior = {
        codigo: this.form.value.codigo,
        texto: this.form.value.texto,
        resultado: this.resultado,
        porCodigo: this.porCodigo,
        porPack: this.porPack,
        porDescripcion: this.porDescripcion,
        parecidas: this.parecidas,
        tituloParecidas: this.tituloParecidas,
      };
    }
    // Sin título, lo que se buscó: el respaldo en Bing necesita algún texto.
    const texto = this.textoParecidas || (this.form.value.texto ?? '').trim();
    const enPantalla = new Set(
      [...this.porCodigo, ...this.porPack, ...this.porDescripcion, ...this.parecidas].map((i) => i.url)
    );
    this.busqueda?.unsubscribe();
    this.buscando = true;
    this.error = null;
    this.limpiarSeleccion();
    this.busqueda = this.presentacionService
      .onGetImagenesParecidasDe(img.url, texto, img.similares)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.buscando = false;
          const todas = res?.imagenes ?? [];
          // Lo que ya estaba en pantalla no suma; si no queda nada nuevo, se muestra igual.
          const nuevas = todas.filter((i) => !enPantalla.has(i.url));
          this.porCodigo = [];
          this.porPack = [];
          this.porDescripcion = [];
          this.parecidas = (nuevas.length > 0 ? nuevas : todas).map((i) => this.vista(i));
          this.tituloParecidas = res?.porTexto
            ? 'Relacionadas con la elegida'
            : res?.aproximada ? 'Parecidas a una foto similar' : 'Parecidas a la elegida';
          this.actualizarSinResultados();
        },
        error: (e) => {
          this.buscando = false;
          this.error = e?.message || 'No se pudieron buscar parecidas. Revisá la conexión con el servidor.';
        },
      });
  }

  volverAnterior(): void {
    const a = this.anterior;
    if (a == null) return;
    this.busqueda?.unsubscribe();
    this.buscando = false;
    this.error = null;
    this.limpiarSeleccion();
    this.form.patchValue({ codigo: a.codigo, texto: a.texto }, { emitEvent: false });
    this.resultado = a.resultado;
    this.porCodigo = a.porCodigo;
    this.porPack = a.porPack;
    this.porDescripcion = a.porDescripcion;
    this.parecidas = a.parecidas;
    this.tituloParecidas = a.tituloParecidas;
    this.actualizarSinResultados();
    this.anterior = null;
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

  private actualizarSinResultados(): void {
    this.sinResultados = this.porCodigo.length + this.porPack.length + this.porDescripcion.length + this.parecidas.length === 0;
  }

  private vista(i: ImagenSugerida): VistaImagen {
    return {
      ...i,
      tamano: i.ancho && i.alto ? `${i.ancho}×${i.alto}` : '',
      esExacta: !!i.exacta,
      oculta: false,
    };
  }
}

import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { ROLES } from "../../../personas/roles/roles.enum";
import {
  GuiaBloque,
  GuiaBloqueTipo,
  GuiaContenido,
  GuiaSeccion,
} from "./guia-devolucion.model";
import { GuiaDevolucionService } from "./guia-devolucion.service";

@Component({
  selector: "app-guia-devolucion",
  templateUrl: "./guia-devolucion.component.html",
  styleUrls: ["./guia-devolucion.component.scss"],
})
export class GuiaDevolucionComponent implements OnInit {
  contenido: GuiaContenido;
  puedeEditar = false;
  editando = false;

  // Opciones para agregar bloques nuevos (modo edicion).
  readonly tiposBloque: { valor: GuiaBloqueTipo; label: string; icono: string }[] = [
    { valor: "texto", label: "Texto", icono: "notes" },
    { valor: "pasos", label: "Lista de pasos", icono: "format_list_numbered" },
    { valor: "nota", label: "Nota / aviso", icono: "lightbulb" },
    { valor: "imagen", label: "Imagen", icono: "image" },
    { valor: "video", label: "Video", icono: "movie" },
    { valor: "tabla", label: "Tabla", icono: "table_chart" },
  ];

  constructor(
    public mainService: MainService,
    private guiaService: GuiaDevolucionService,
    private sanitizer: DomSanitizer,
    private notif: NotificacionSnackbarService,
    private dialogos: DialogosService
  ) {}

  ngOnInit(): void {
    this.puedeEditar =
      !!this.mainService.usuarioActual &&
      !!this.mainService.usuarioActual.roles &&
      this.mainService.usuarioActual.roles.includes(ROLES.ADMIN);
    this.cargar();
  }

  private cargar(): void {
    this.contenido = this.guiaService.cargar();
    this.prepararVideos();
  }

  // ---------- render helpers ----------
  private prepararVideos(): void {
    for (const seccion of this.contenido.secciones) {
      for (const bloque of seccion.bloques) {
        if (bloque.tipo === "video") {
          this.prepararVideo(bloque);
        }
      }
    }
  }

  prepararVideo(bloque: GuiaBloque): void {
    bloque._esVideoArchivo = false;
    bloque._embedUrl = undefined;
    const url = (bloque.url || "").trim();
    if (!url) {
      return;
    }
    let m = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/
    );
    if (m) {
      bloque._embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        "https://www.youtube.com/embed/" + m[1]
      );
      return;
    }
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) {
      bloque._embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        "https://player.vimeo.com/video/" + m[1]
      );
      return;
    }
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
      bloque._esVideoArchivo = true;
      return;
    }
    bloque._embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ---------- modo edicion ----------
  onEditar(): void {
    if (!this.puedeEditar) {
      return;
    }
    this.editando = true;
  }

  onCancelar(): void {
    this.editando = false;
    this.cargar(); // descarta cambios no guardados
  }

  onGuardar(): void {
    const usuario: any = this.mainService.usuarioActual;
    const nombre =
      (usuario && usuario.persona && usuario.persona.nombre) ||
      (usuario && usuario.nombre) ||
      undefined;
    this.contenido = this.guiaService.guardar(this.contenido, nombre);
    this.prepararVideos();
    this.editando = false;
    this.notif.openGuardadoConExito();
  }

  onRestaurar(): void {
    this.dialogos
      .confirm(
        "Restaurar guía original",
        "Se perderán las ediciones realizadas y se volverá al contenido original.",
        "¿Deseás continuar?",
        null,
        true,
        "Restaurar",
        null,
        "Cancelar"
      )
      .subscribe((res) => {
        if (res) {
          this.contenido = this.guiaService.restaurarDefault();
          this.prepararVideos();
          this.notif.openSucess("Guía restaurada al contenido original");
        }
      });
  }

  // ---------- secciones ----------
  agregarSeccion(): void {
    this.contenido.secciones.push({
      id: "seccion_" + this.contenido.secciones.length,
      titulo: "Nueva sección",
      icono: "article",
      bloques: [{ tipo: "texto", texto: "" }],
    });
  }

  eliminarSeccion(index: number): void {
    this.contenido.secciones.splice(index, 1);
  }

  moverSeccion(index: number, dir: number): void {
    const destino = index + dir;
    if (destino < 0 || destino >= this.contenido.secciones.length) {
      return;
    }
    const arr = this.contenido.secciones;
    [arr[index], arr[destino]] = [arr[destino], arr[index]];
  }

  // ---------- bloques ----------
  agregarBloque(seccion: GuiaSeccion, tipo: GuiaBloqueTipo): void {
    const bloque: GuiaBloque = { tipo };
    if (tipo === "pasos") {
      bloque.items = [""];
    } else if (tipo === "tabla") {
      bloque.columnas = ["Columna 1", "Columna 2"];
      bloque.filas = [["", ""]];
    } else {
      bloque.texto = "";
    }
    seccion.bloques.push(bloque);
  }

  eliminarBloque(seccion: GuiaSeccion, index: number): void {
    seccion.bloques.splice(index, 1);
  }

  moverBloque(seccion: GuiaSeccion, index: number, dir: number): void {
    const destino = index + dir;
    if (destino < 0 || destino >= seccion.bloques.length) {
      return;
    }
    const arr = seccion.bloques;
    [arr[index], arr[destino]] = [arr[destino], arr[index]];
  }

  // ---------- items de pasos ----------
  agregarItem(bloque: GuiaBloque): void {
    if (!bloque.items) {
      bloque.items = [];
    }
    bloque.items.push("");
  }

  eliminarItem(bloque: GuiaBloque, index: number): void {
    if (bloque.items) {
      bloque.items.splice(index, 1);
    }
  }

  // ---------- filas de tabla ----------
  agregarFila(bloque: GuiaBloque): void {
    if (!bloque.filas) {
      bloque.filas = [];
    }
    const cols = bloque.columnas ? bloque.columnas.length : 0;
    bloque.filas.push(new Array(cols).fill(""));
  }

  eliminarFila(bloque: GuiaBloque, index: number): void {
    if (bloque.filas) {
      bloque.filas.splice(index, 1);
    }
  }

  // ---------- trackBy ----------
  trackByIndex(index: number): number {
    return index;
  }
}

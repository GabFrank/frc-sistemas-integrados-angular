import { Injectable } from "@angular/core";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Observable } from "rxjs";
import { DialogosComponent } from "./dialogos.component";

export interface ConfirmarOpciones {
  titulo: string;
  mensaje: string;
  detalle?: string;
  lista?: string[];
  /** Texto del boton que confirma. Default: «Si». */
  si?: string;
  /** Texto del boton que vuelve atras. Default: «No». */
  no?: string;
  /** Cabecera roja. Sin pasarlo se deduce del titulo (Eliminar/Anular/Borrar/Revocar). */
  peligro?: boolean;
  /**
   * Boton con el foco al abrir. Default: 'no', para que un Enter apurado (cajero, lector) no confirme una
   * accion que no se puede deshacer.
   */
  foco?: "si" | "no";
  ancho?: string;
  /** Esc o click afuera cierran sin elegir (devuelve null). Default: true. */
  cerrable?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class DialogosService {
  private dialogRef: MatDialogRef<DialogosComponent>;

  constructor(private dialog: MatDialog) {}

  public confirm(
    title: string,
    message1: string,
    message2?: string,
    listMessages?: string[],
    action?: boolean,
    btn1Name?: string,
    btn2Name?: string,
    btn3Name?: string,
    servidor: boolean = true,
    /** Cabecera roja (eliminar/anular). Sin pasarlo se deduce del titulo. */
    peligro?: boolean
  ): Observable<any> {
    this.dialogRef = this.dialog.open(DialogosComponent, {
      autoFocus: false,
      restoreFocus: true,
      disableClose: btn3Name ? false : true, // Permitir cerrar con ESC si hay botón de cancelar
      data: {
        title,
        message1,
        message2,
        listMessages,
        action: action == null ? true : action,
        btn1Name,
        btn2Name,
        btn3Name,
        peligro,
      },
    });

    return this.dialogRef.afterClosed();
  }

  /**
   * Confirmacion con opciones por nombre. Devuelve true (confirma), false (vuelve atras) o null
   * (Esc/click afuera, solo si `cerrable`): quien llama trata todo lo que no sea true como «no».
   */
  public confirmar(o: ConfirmarOpciones): Observable<boolean | null> {
    return this.dialog.open(DialogosComponent, {
      autoFocus: false,
      restoreFocus: true,
      width: o.ancho,
      disableClose: o.cerrable === false,
      data: {
        title: o.titulo,
        message1: o.mensaje,
        message2: o.detalle,
        listMessages: o.lista,
        action: true,
        btn1Name: o.si,
        btn2Name: o.no,
        peligro: o.peligro,
        foco: o.foco ?? "no",
      },
    }).afterClosed();
  }
}

import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DteService } from "../dte.service";
import { EventoDteDto } from "../graphql/registrarEventoDte";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

export interface EventosDteViewData {
  dteId: number;
}

interface EventoDteView extends EventoDteDto {
  tipoDesc: string;
}

const TIPO_EVENTO_DESC: { [k: number]: string } = {
  1: 'Cancelación',
  2: 'Conformidad del receptor',
  3: 'Disconformidad del receptor',
  4: 'Inutilización',
};

@UntilDestroy()
@Component({
  selector: "app-eventos-dte-view-dialog",
  templateUrl: "./eventos-dte-view-dialog.component.html",
  styleUrls: ["./eventos-dte-view-dialog.component.scss"],
})
export class EventosDteViewDialogComponent implements OnInit {
  eventos: EventoDteView[] = [];
  loading = true;

  constructor(
    private dialogRef: MatDialogRef<EventosDteViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventosDteViewData,
    private dteService: DteService
  ) {}

  ngOnInit(): void {
    this.dteService
      .listarEventos(this.data.dteId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: EventoDteDto[]) => {
          const list = Array.isArray(res) ? res : [];
          this.eventos = list.map(e => ({
            ...e,
            tipoDesc: TIPO_EVENTO_DESC[e?.tipoEvento as number] || `Tipo ${e?.tipoEvento}`,
          }));
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  cerrar() {
    this.dialogRef.close();
  }
}

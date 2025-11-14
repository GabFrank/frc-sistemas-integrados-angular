import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Persona } from "../persona.model";
import { PersonaService } from "../persona.service";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from "../../../../app.component";
import { PageEvent } from "@angular/material/paginator";

export class BuscarPersonaData {
  persona?: Persona;
  isAdicionar?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-buscar-persona-dialog",
  templateUrl: "./buscar-persona-dialog.component.html",
  styleUrls: ["./buscar-persona-dialog.component.scss"]
})
export class BuscarPersonaDialogComponent implements OnInit {
  buscarControl = new FormControl();
  dataSource = new MatTableDataSource<Persona>();
  selectedRowIndex: number = -1;
  selectedPersona: Persona | null = null;
  isSearching = false;
  onSearchTimer: any;
  selectedPageInfo: PageInfo<Persona>;
  pageSize = 15;
  pageIndex = 0;

  displayedColumns = [
    "id",
    "nombre",
    "documento"
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BuscarPersonaData,
    private matDialogRef: MatDialogRef<BuscarPersonaDialogComponent>,
    private personaService: PersonaService
  ) {
    if (this.data?.isAdicionar == null) {
      this.data.isAdicionar = true;
    }
  }

  ngOnInit(): void {
    // No buscar automáticamente al iniciar
  }

  onSearchPersona(text: string) {
    this.isSearching = true;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }
    if (text == "" || text == null || text == " " || text.trim() == "") {
      this.dataSource.data = [];
      this.isSearching = false;
      this.selectedPageInfo = null;
      return;
    }
    
    this.onSearchTimer = setTimeout(() => {
      this.personaService.onSearch(text).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res && Array.isArray(res)) {
          this.dataSource.data = res;
          // Crear un PageInfo básico para la paginación
          this.selectedPageInfo = new PageInfo<Persona>();
          this.selectedPageInfo.getContent = res;
          this.selectedPageInfo.getTotalElements = res.length;
          this.selectedPageInfo.getNumberOfElements = res.length;
        } else {
          this.dataSource.data = [];
          this.selectedPageInfo = null;
        }
        this.isSearching = false;
      });
    }, 500);
  }

  onSelectRow(row: Persona, index: number) {
    this.selectedRowIndex = index;
    this.selectedPersona = row;
  }

  onAceptar() {
    if (this.selectedPersona) {
      this.matDialogRef.close(this.selectedPersona);
    }
  }

  onCancelar() {
    this.matDialogRef.close();
  }

  onAdicionar() {
    this.matDialogRef.close({ adicionar: true });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    // Si hay texto de búsqueda, buscar de nuevo con la nueva página
    if (this.buscarControl.value) {
      this.onSearchPersona(this.buscarControl.value);
    }
  }
}

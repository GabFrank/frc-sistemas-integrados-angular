import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { AdicionarCajaDialogComponent } from "../adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja, PdvCajaEstado } from "../caja.model";
import { CajaService } from "../caja.service";

@Component({
  selector: "app-list-caja",
  templateUrl: "./list-caja.component.html",
  styleUrls: ["./list-caja.component.scss"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListCajaComponent implements OnInit {
  dataSource = new MatTableDataSource<PdvCaja>(null);
  selectedPdvCaja: PdvCaja;
  expandedCaja: PdvCaja;

  displayedColumns = [
    'id',
    'maletin',
    'activo',
    'estado',
    'fechaApertura',
    'fechaCierre',
    // 'observacion',
    'usuario',
    'acciones'
  ];

  constructor(private cajaService: CajaService, private matDialog: MatDialog, private cargandoDialog: CargandoDialogService) {}

  ngOnInit(): void {
    this.cajaService.onGetByDate(null, null).subscribe((res) => {
      if (res != null) {
        this.dataSource.data = res;
      }
    });

    console.log(PdvCajaEstado["En proceso"])
  }

  onAdd(caja?: PdvCaja, index?) {
    this.matDialog.open(AdicionarCajaDialogComponent, {
      data: {
        caja
      },
      width: '90%',
      height: '80%',
      disableClose: true,
      autoFocus: true,
      restoreFocus: true
    })
  }

  onFilter() {}

  onResetFilter() {}
}

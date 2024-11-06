import { MainService } from './../../../../main.service';
import { PdvGrupo } from './../../comercial/venta-touch/pdv-grupo/pdv-grupo.model';
import { NotificacionColor, NotificacionSnackbarService } from './../../../../notificacion-snackbar.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CargandoDialogService } from "./../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { PdvCategoria } from "../../comercial/venta-touch/pdv-categoria/pdv-categoria.model";
import { PdvCategoriaService } from "../../comercial/venta-touch/pdv-categoria/pdv-categoria.service";

@UntilDestroy()
@Component({
  selector: "app-favoritos",
  templateUrl: "./favoritos.component.html",
  styleUrls: ["./favoritos.component.scss"],
})
export class FavoritosComponent implements OnInit {

  @Output()
  event = new EventEmitter<PdvGrupo>(null);
  selectedPdvCategoria: PdvCategoria;
  pdvCategorias: PdvCategoria[] = [];
  isCargandoPDV = true;

  constructor(
    private pdvCategoriaService: PdvCategoriaService,
    private cargandoService: CargandoDialogService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private mainService: MainService
  ) { }

  ngOnInit(): void {
    this.buscarPdvCategoria()
  }

  buscarPdvCategoria() {
    this.pdvCategoriaService.pdvCategoriasSub.subscribe(res => {
      this.pdvCategorias = res;
      this.selectedPdvCategoria = this.pdvCategorias[0];
      this.isCargandoPDV = false;
    })
  }

  onGridCardClick(grupo) {
    this.event.emit(grupo)
  }

  actualizar() {
    this.pdvCategoriaService.onRefresh()
  }
}

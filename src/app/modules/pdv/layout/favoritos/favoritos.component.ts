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
    this.pdvCategoriaService
      .onGetCategorias()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // this.cargandoService.openDialog(false, "Cargando Otros");
        // this.cargandoService.closeDialog();
        if (res.errors == null) {
          this.pdvCategorias = res.data.data;
          res.data.data.forEach((cat) => {
            cat.grupos.forEach((gr) => {
              if (gr.activo == true) {
                this.pdvCategoriaService
                  .onGetGrupoProductosPorGrupoId(gr.id)
                  .pipe(untilDestroyed(this))
                  .subscribe((res) => {
                    if (res != null) {
                      console.log("cargando: " + gr.descripcion);
                      gr.pdvGruposProductos = res;
                    }
                  });
              }
            });
            console.log("carga completa");
          });
          this.selectedPdvCategoria = this.pdvCategorias[0];
          this.isCargandoPDV = false;
        } else {
          this.notificacionSnackbar.notification$.next({
            texto: "No fue posible cargar categorias",
            color: NotificacionColor.warn,
            duracion: 3,
          });
        }
      });
  }

  onGridCardClick(grupo) {
    this.event.emit(grupo)
  }

  actualizar(){
    this.buscarPdvCategoria()
  }
}

import { Component, OnInit } from "@angular/core";
import { PdvCategoria } from "../../comercial/venta-touch/pdv-categoria/pdv-categoria.model";
import { PdvCategoriaService } from "../../comercial/venta-touch/pdv-categoria/pdv-categoria.service";

@Component({
  selector: "app-favoritos",
  templateUrl: "./favoritos.component.html",
  styleUrls: ["./favoritos.component.scss"],
})
export class FavoritosComponent implements OnInit {
  
  buscarPdvCategoria;
  selectedPdvCategoria: PdvCategoria;
  pdvCategorias: PdvCategoria[] = [];

  constructor(private pdvCategoriaService: PdvCategoriaService) {}

  ngOnInit(): void {
    
  }

  // buscarPdvCategoria() {
  //   this.cargandoService.openDialog(false, "Cargando favoritos");
  //   this.pdvCategoriaService.onGetCategorias().pipe(untilDestroyed(this)).subscribe((res) => {
  //     this.cargandoService.openDialog(false, "Cargando Otros");
  //     setTimeout(() => {
  //       this.cargandoService.closeDialog();
  //       this.cargandoService.closeDialog();
  //     }, 2000);
  //     if (res.errors == null) {
  //       this.pdvCategorias = res.data.data;
  //       this.pdvCategorias.forEach((cat) => {
  //         cat.grupos.forEach((gr) => {
  //           if (gr.activo == true) {
  //             this.pdvCategoriaService
  //               .onGetGrupoProductosPorGrupoId(gr.id).pipe(untilDestroyed(this))
  //               .subscribe((res) => {
  //                 if (res != null) {
  //                   console.log("cargando: " + gr.descripcion);
  //                   gr.pdvGruposProductos = res;
  //                 }
  //               });
  //           }
  //         });
  //         console.log("carga completa");
  //       });
  //       this.selectedPdvCategoria = this.pdvCategorias[0];
  //       this.isCargandoPDV = false;
  //     } else {
  //       this.notificacionSnackbar.notification$.next({
  //         texto: "No fue posible cargar categorias",
  //         color: NotificacionColor.warn,
  //         duracion: 3,
  //       });
  //     }
  //   });
  // }

  onGridCardClick(pdvGruposProductos, texto) {}
}

import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Moneda } from "../../../../modules/financiero/moneda/moneda.model";
import { Proveedor } from "../../../../modules/personas/proveedor/proveedor.model";
import { PedidoEstado } from "./pedido-enums";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Pedido } from "./pedido.model";
import { MonedaComponent } from "../../../financiero/moneda/moneda.component";
import { Subscription } from "rxjs";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { VendedorService } from "../../../personas/vendedor/vendedor.service";
import { Vendedor } from "../../../personas/vendedor/vendedor.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { orderByIdAsc, orderByIdDesc } from "../../../../commons/core/utils/arraysUtil";
import { MatTableDataSource } from "@angular/material/table";
import { PedidoItem } from "./pedido-item.model";
import { randomInt } from "crypto";
import { Producto } from "../../../productos/producto/producto.model";
import { MatDialog } from "@angular/material/dialog";
import { AdicionarItemDialogComponent } from "../adicionar-item-dialog/adicionar-item-dialog.component";

export interface Transaction {
  item: string;
  cost: number;
}

@Component({
  selector: "app-edit-pedido",
  templateUrl: "./edit-pedido.component.html",
  styleUrls: ["./edit-pedido.component.scss"],
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
export class EditPedidoComponent implements OnInit {
  @ViewChild("proveedorInput", { static: false })
  proveedorInput: ElementRef;

  @ViewChild("vendedorInput", { static: false })
  vendedorInput: ElementRef;

  @ViewChild("formaPagoInput", { static: false })
  formaPagoInput: ElementRef;

  @ViewChild("monedaInput", { static: false })
  monedaInput: ElementRef;

  detalleForm: FormGroup = new FormGroup({});

  idControl = new FormControl();
  vendedorControl = new FormControl();
  proveedorControl = new FormControl(null, Validators.required);
  fechaEntregaControl = new FormControl();
  formaPagoControl = new FormControl();
  estadoControl = new FormControl(PedidoEstado.ABIERTO);
  monedaControl = new FormControl();
  plazoCreditoControl = new FormControl(8);
  descuentoControl = new FormControl(0);
  creadoEnControl = new FormControl();
  usuarioControl = new FormControl();
  creditoControl = new FormControl(true);

  selectedPedido: Pedido;
  selectedProveedor: Proveedor;
  selectedVendedor: Vendedor;
  selectedMoneda: Moneda;
  selectedFormaPago: FormaPago;
  selectedUsuario: Usuario;

  proveedorList: Proveedor[];
  proveedorSub: Subscription;
  proveedorTimer;

  vendedorList: Vendedor[];
  vendedorSub: Subscription;
  vendedorTimer;

  formaPagoList: FormaPago[];
  formaPagoSub: Subscription;
  formaPagoTimer;

  monedaList: Moneda[];
  monedaSub: Subscription;
  monedaTimer;

  //table
  columnsToDisplay = ['numero','producto','presentacion','cantidad','precioUnitario','descuentoUnitario','bonificacion', 'acciones']
  dataSource = new MatTableDataSource<PedidoItem>(null);
  expandedPedidoItem: PedidoItem | null;

  constructor(
    private proveedorService: ProveedorService,
    private vendedorService: VendedorService,
    private formaPagoService: FormaPagoService,
    private monedaService: MonedaService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.proveedorList = [];
    this.vendedorList = [];
    this.formaPagoList = []
    this.monedaList = []

    this.formaPagoService.onGetAllFormaPago().subscribe(res => {
      if(res!=null){
        this.formaPagoList = res;
        if(this.formaPagoList.length > 0){
          this.onFormaPagoSelect(this.formaPagoList.find(f => f.descripcion == 'EFECTIVO'))
        }
      }
    })

    this.monedaService.onGetAll().subscribe(res => {
      if(res!=null){
        this.monedaList = res;
        if(this.monedaList.length > 0){
          this.onMonedaSelect(this.monedaList.find(f => f.denominacion == 'GUARANI'))
        }
      }
    })

    this.proveedorSub = this.proveedorControl.valueChanges.subscribe((res) => {
      console.log(res);
      if (res == "") this.selectedProveedor = null;
      if (this.proveedorTimer != null) {
        clearTimeout(this.proveedorTimer);
      }
      if (res != null && res.length != 0) {
        this.proveedorTimer = setTimeout(() => {
          this.proveedorService.onSearch(res).subscribe((response) => {
            console.log(response);
            this.proveedorList = response;
            if (this.proveedorList.length == 1) {
              this.onProveedorSelect(this.proveedorList[0]);
              this.onProveedorAutocompleteClose();
            } else {
              this.onProveedorAutocompleteClose();
              this.onProveedorSelect(null);
            }
          });
        }, 500);
      } else {
        this.proveedorList = [];
      }
    });

    this.vendedorSub = this.vendedorControl.valueChanges.subscribe((res) => {
      console.log(res);
      if (res == "") this.selectedVendedor = null;
      if (this.vendedorTimer != null) {
        clearTimeout(this.vendedorTimer);
      }
      if (res != null && res.length != 0) {
        this.vendedorTimer = setTimeout(() => {
          this.vendedorService.onSearch(res).subscribe((response) => {
            console.log(response);
            this.vendedorList = response;
            if (this.vendedorList.length == 1) {
              this.onVendedorSelect(this.vendedorList[0]);
              this.onVendedorAutocompleteClose();
            } else {
              this.onVendedorAutocompleteClose();
              this.onVendedorSelect(null);
            }
          });
        }, 500);
      } else {
        this.vendedorList = [];
      }
    });

    setTimeout(() => {
      this.proveedorInput.nativeElement.focus()
    }, 500);

    this.onAdicionar()
  }

  createDetalleForm() {
    this.detalleForm = new FormGroup({
      id: this.idControl,
      vendedor: this.vendedorControl,
      proveedor: this.proveedorControl,
      fechaEntrega: this.fechaEntregaControl,
      formaPago: this.formaPagoControl,
      estado: this.estadoControl,
      moneda: this.monedaControl,
      plazoCredito: this.plazoCreditoControl,
      descuento: this.descuentoControl,
      creadoEn: this.creadoEnControl,
      usuario: this.usuarioControl,
    });
  }

  onProveedorSelect(e: Proveedor) {
    if (e?.id != null) {
      this.selectedProveedor = e;
      this.proveedorControl.setValue(
        this.selectedProveedor?.id +
          " - " +
          this.selectedProveedor?.persona?.nombre
      );
      if (e?.vendedores != null) {
        this.vendedorList = e.vendedores;
        this.proveedorInput.nativeElement.select();
      }
    }
  }

  onProveedorAutocompleteClose() {
    setTimeout(() => {
      this.proveedorInput.nativeElement.select();
    }, 100);
  }

  onVendedorSelect(e: Vendedor) {
    if (e?.id != null) {
      this.selectedVendedor = e;
      this.vendedorControl.setValue(
        this.selectedVendedor?.id +
          " - " +
          this.selectedVendedor?.persona?.nombre
      );
      if (e?.proveedores != null) {
        if (this.selectedProveedor == null) {
        }
        this.proveedorList = e.proveedores;

        this.proveedorInput.nativeElement.select();
      }
    }
  }

  onVendedorAutocompleteClose() {
    setTimeout(() => {
      this.vendedorInput.nativeElement.select();
    }, 100);
  }

  onFormaPagoSelect(e: FormaPago) {
    if (e?.id != null) {
      this.selectedFormaPago = e;
      this.formaPagoControl.setValue(this.selectedFormaPago);
    }
  }

  onFormaPagoAutocompleteClose() {
    setTimeout(() => {
      this.formaPagoInput.nativeElement.select();
    }, 100);
  }

  onMonedaSelect(e: Moneda) {
    if (e?.id != null) {
      this.selectedMoneda = e;
      this.monedaControl.setValue(this.selectedMoneda)
    }
  }

  onMonedaAutocompleteClose() {
    setTimeout(() => {
      this.monedaInput.nativeElement.select();
    }, 100);
  }

  onAdicionar(){
    if(this.selectedPedido!=null || true){
      this.matDialog.open(AdicionarItemDialogComponent, {
        data: {
          pedido: this.selectedPedido
        },
        width: '80%',
        height: '70%',
        disableClose: false
      })
    }
  }
}

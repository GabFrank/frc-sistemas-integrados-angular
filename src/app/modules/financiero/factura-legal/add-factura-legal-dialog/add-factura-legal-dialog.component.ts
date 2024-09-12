import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subject } from "rxjs";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { getDigitoVerificadorString } from "../../../../commons/core/utils/rucUtils";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../operaciones/venta/venta.model";
import { Cliente, TipoCliente } from "../../../personas/clientes/cliente.model";
import { ClienteService } from "../../../personas/clientes/cliente.service";
import { Persona } from "../../../personas/persona/persona.model";
import { PersonaService } from "../../../personas/persona/persona.service";
import { CajaService } from "../../pdv/caja/caja.service";
import { EditFacturaLegalItemComponent } from "../edit-factura-legal-item/edit-factura-legal-item.component";
import {
  FacturaLegal,
  FacturaLegalItem,
  FacturaLegalItemInput,
} from "../factura-legal.model";
import { FacturaLegalService } from "../factura-legal.service";
import { PersonaSearchGQL } from "../../../personas/persona/graphql/personaSearch";
import { UsuarioService } from "../../../personas/usuarios/usuario.service";
import { RucService } from "../../../../shared/services/ruc.service";

export interface FacturaLegalData {
  venta?: Venta;
  ventaItemList: VentaItem[];
  descuento: number;
}

@UntilDestroy()
@Component({
  selector: "app-add-factura-legal-dialog",
  templateUrl: "./add-factura-legal-dialog.component.html",
  styleUrls: ["./add-factura-legal-dialog.component.scss"],
})
export class AddFacturaLegalDialogComponent implements OnInit, AfterViewInit {
  @ViewChild("imprimirBtn", { static: false }) imprimirBtn: ElementRef;
  @ViewChild("rucInput", { static: false }) rucInput: ElementRef;
  @ViewChild("nombreInput", { static: false }) nombreInput: ElementRef;

  selectedCliente: Cliente;
  selectedVenta: Venta;

  clienteIdControl = new FormControl(null, Validators.required);
  clienteDescripcionControl = new FormControl(null, Validators.required);
  fechaControl = new FormControl(new Date());
  creditoControl = new FormControl(false);
  rucControl = new FormControl(null, [
    Validators.required,
    Validators.minLength(1),
  ]);
  direccionControl = new FormControl("");
  totalFinalControl = new FormControl(0, [
    Validators.required,
    Validators.min(1),
  ]);
  tributaControl = new FormControl(true);

  dataSource = new MatTableDataSource<FacturaLegalItem>([]);
  selectedFacturaItem: FacturaLegalItem;
  cantidadHojas = 1;

  digitoVerificador = "";

  guardarSub = new Subject<boolean>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FacturaLegalData,
    private matDialogRef: MatDialogRef<AddFacturaLegalDialogComponent>,
    private facturaService: FacturaLegalService,
    private clienteService: ClienteService,
    private notificacionService: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService,
    private dialogoService: DialogosService,
    private matDialog: MatDialog,
    private personaService: PersonaService,
    private cajaService: CajaService,
    private personaSearch: PersonaSearchGQL,
    private dialog: MatDialog,
    private usuarioService: UsuarioService,
    private rucService: RucService
  ) {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.rucInput.nativeElement.focus();
    }, 500);
  }

  ngOnInit(): void {
    this.clienteDescripcionControl.disable();
    this.direccionControl.disable();
    this.cargarDatos();

    this.rucControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.rucControl.value?.length > 4) {
        this.digitoVerificador = getDigitoVerificadorString(
          this.rucControl.value
        );
      } else {
        this.digitoVerificador = "";
      }
    });
  }

  cargarDatos() {
    if (this.data.venta != null) {
      this.totalFinalControl.setValue(this.data?.venta?.totalGs);
    }
    if (this.data.ventaItemList != null) {
      let facturaItemList: FacturaLegalItem[] = [];
      this.data.ventaItemList.forEach((v) => {
        let facturaItem = new FacturaLegalItem();
        facturaItem.cantidad = v.cantidad;
        facturaItem.descripcion = v.producto.descripcionFactura;
        facturaItem.precioUnitario = v.precio;
        facturaItem.total = v.cantidad * v.precio;
        facturaItem.iva;
        facturaItem.presentacion = v.presentacion;
        facturaItemList.push(facturaItem);
      });
      this.cantidadHojas = Math.floor(facturaItemList.length / 7) + 1;
      this.dataSource.data = facturaItemList;
    }
  }

  buscarCliente() {
    this.clienteDescripcionControl.disable();
    this.direccionControl.disable();
    if (this.rucControl.valid) {
      let validText: string = this.rucControl.value;
      let arr = validText.split("-");
      validText = arr[0];
      this.rucControl.setValue(validText);
      console.log(this.rucControl.value, this.selectedCliente?.documento);
      
      if (
        this.rucControl.value == this.selectedCliente?.documento &&
        this.totalFinalControl.valid
      ) {
        this.onGuardar();
      } else {
        this.selectedCliente = null;
        this.clienteDescripcionControl.setValue(null);
        this.direccionControl.setValue(null);
        this.tributaControl.setValue(true);
        this.cargandoService.openDialog();
        this.clienteService
          .onGetClientePorPersonaDocumento(this.rucControl.value)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.cargandoService.closeDialog();
            if (res != null) {
              this.setCliente(res);
            } else {
              this.clienteService
                .onSearch(this.rucControl.value)
                .pipe(untilDestroyed(this))
                .subscribe((res2) => {
                  if (res2?.length == 0) {
                    this.personaService
                      .onSearch(this.rucControl.value)
                      .pipe(untilDestroyed(this))
                      .subscribe((personaRes) => {
                        if (personaRes?.length == 0) {
                          this.notificacionService.openWarn(
                            "Cliente no encontrado"
                          );
                          setTimeout(() => {
                            this.dialogoService
                              .confirm(
                                "Cliente no encontrado",
                                "Desea crear un nuevo cliente?",
                                "Verifique si el número de documento/ruc esta correcto antes de crear un nuevo cliente"
                              )
                              .subscribe((res3) => {
                                if (res3) {
                                  this.crearNuevoCliente();
                                }
                              });
                          }, 500);
                        } else if (personaRes?.length == 1) {
                          this.crearNuevoCliente(personaRes[0]);
                        } else {
                          let data: SearchListtDialogData = {
                            titulo: "Seleccionar Cliente",
                            query: null,
                            tableData: [
                              { id: "id", nombre: "Id", width: "10%" },
                              { id: "nombre", nombre: "Nombre", width: "70%" },
                              {
                                id: "documento",
                                nombre: "Documento/Ruc",
                                width: "20%",
                              },
                            ],
                            inicialData: personaRes,
                          };
                          // data.
                          this.matDialog
                            .open(SearchListDialogComponent, {
                              data,
                              height: "80%",
                              width: "80%",
                            })
                            .afterClosed()
                            .pipe(untilDestroyed(this))
                            .subscribe((res5) => {
                              if (res5 != null) {
                                this.crearNuevoCliente(res5);
                              }
                            });
                        }
                      });
                  } else if (res2?.length == 1) {
                    this.setCliente(res2[0]);
                  } else {
                    let data: SearchListtDialogData = {
                      titulo: "Seleccionar Cliente",
                      query: null,
                      tableData: [
                        { id: "id", nombre: "Id", width: "10%" },
                        { id: "nombre", nombre: "Nombre", width: "70%" },
                        {
                          id: "documento",
                          nombre: "Documento/Ruc",
                          width: "20%",
                        },
                      ],
                      inicialData: res2,
                    };
                    // data.
                    this.matDialog
                      .open(SearchListDialogComponent, {
                        data,
                        height: "80%",
                        width: "80%",
                      })
                      .afterClosed()
                      .pipe(untilDestroyed(this))
                      .subscribe((res4) => {
                        if (res4 != null) {
                          this.setCliente(res4);
                        } else {
                          alert("Cliente no encontrado");
                        }
                      });
                  }
                });
            }
          });
      }
    } else {
      this.onClienteSearch();
    }
  }

  setCliente(res: Cliente) {
    if (res != null) this.selectedCliente = new Cliente();
    Object.assign(this.selectedCliente, res);
    this.notificacionService.openSucess("Cliente encontrado");
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.clienteDescripcionControl.setValue(res.persona?.nombre);
    this.direccionControl.setValue(res?.persona?.direccion);
    this.clienteDescripcionControl.disable();
    this.direccionControl.disable();
    this.tributaControl.setValue(res?.tributa == false ? false : true);
    // Wait for clienteService response and handle success and error
    if (this.selectedCliente?.verificadoSet == false) {
      this.clienteService.onConsultaRuc(this.rucControl.value).subscribe({
        next: (rucRes) => {
          if (rucRes?.ruc != null) {
            this.clienteDescripcionControl.setValue(rucRes?.nombre);
            this.direccionControl.setValue(rucRes?.direccion);
            this.tributaControl.setValue(true);
            if (
              (this.selectedCliente.nombre != rucRes.nombre &&
                this.selectedCliente.nombre != rucRes?.nombreFantasia) ||
              this.selectedCliente.persona.direccion != rucRes.direccion
            )
              this.dialogoService
                .confirm(
                  "Atención!!",
                  "Los datos del cliente guardados en el sistema son diferentes a los verificados en la plataforma de SET, le gustaria actualizar?"
                )
                .subscribe((dialogRes) => {
                  if (dialogRes) {
                    this.selectedCliente.nombre = rucRes.nombre;
                    this.selectedCliente.direccion = rucRes.direccion;
                    this.selectedCliente.tributa = true;
                    this.selectedCliente.verificadoSet = true;
                    this.clienteService
                      .onSaveCliente(this.selectedCliente.toInput())
                      .subscribe();
                  }
                });
          } else {
            console.log("entra en el no tributa");
            this.tributaControl.setValue(false);
            this.selectedCliente.tributa = false;
            this.selectedCliente.verificadoSet = true;
            this.selectedCliente.documento = rucRes.ruc;

            this.clienteService
              .onSaveCliente(this.selectedCliente.toInput())
              .subscribe();
          }
        },
        error: (error) => {
          this.notificacionService.openSucess("No fue posible consultar SET");
        },
        complete: () => {},
      });
    }
  }

  crearNuevoCliente(persona?: Persona) {
    this.clienteService.onConsultaRuc(this.rucControl.value).subscribe({
      next: (rucRes) => {
        if (rucRes?.nombre != null) {
          this.clienteDescripcionControl.setValue(rucRes.nombre);
          this.direccionControl.setValue(rucRes?.direccion);
          this.selectedCliente = new Cliente;
          this.selectedCliente.documento = rucRes.ruc;
        } else {
          this.dialogoService
            .confirm(
              "Atención!!",
              "Este ruc no esta registrado en la SET. Desea editar el ruc o continuar?",
              "Si continua se cambiara a facturación con cédula (sin guión)",
              null,
              true,
              "Editar ruc",
              "Continuar"
            )
            .subscribe((dialogRes) => {
              if(!dialogRes){
                this.tributaControl.setValue(false);
                this.clienteDescripcionControl.enable();
                this.direccionControl.enable();
                this.nombreInput.nativeElement.focus();
                this.selectedCliente = new Cliente;
                this.selectedCliente.documento = rucRes.ruc;
              } else {
                this.nombreInput.nativeElement.select();
              }
              
            });
        }
      },
      error: (error) => {
        this.clienteDescripcionControl.enable();
        this.direccionControl.enable();
        this.nombreInput.nativeElement.focus();
      },
      complete: () => {
        if (persona != null) {
          //hay persona no hay cliente
          if(this.selectedCliente == null) this.selectedCliente = new Cliente();
          this.selectedCliente.persona = persona;
          this.selectedCliente.tipo = TipoCliente.NORMAL;
          this.setCliente(this.selectedCliente);
        }
      },
    });
  }

  editItem(item, i) {}

  deleteItem(item, i) {
    this.dataSource.data = updateDataSource(this.dataSource.data, null, i);
    this.calcularTotal();
  }

  onSelectItem(row) {}

  addItem(item, i?) {
    this.matDialog
      .open(EditFacturaLegalItemComponent, {
        data: {
          facturaItem: item,
        },
        width: "100%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSource(this.dataSource.data, res, i);
          this.calcularTotal();
        }
      });
  }

  calcularTotal() {
    let total = 0;
    this.dataSource.data.forEach((f) => {
      total += f.cantidad * f.precioUnitario;
    });
    this.totalFinalControl.setValue(total);
  }

  onCancelar() {
    this.matDialogRef.close(null);
  }

  onGuardar() {
    this.dialogoService
      .confirm(
        "Atención",
        "Verificar si hay hoja en la impresora",
        "Desea imprimir?"
      )
      .subscribe((res) => {
        if (res) {
          if (this.selectedCliente?.id == null) {
            if (this.selectedCliente == null)
              this.selectedCliente = new Cliente();
            this.selectedCliente.nombre = this.clienteDescripcionControl.value;
            this.selectedCliente.direccion = this.direccionControl.value;
            this.selectedCliente.tributa = this.tributaControl.value;
            this.selectedCliente.documento = this.rucControl.value;
            this.selectedCliente.verificadoSet = false;
            this.clienteService
              .onSaveCliente(this.selectedCliente.toInput())
              .subscribe({
                next: (saveRes) => {
                  console.log("guardado sin error");

                  this.selectedCliente = saveRes;
                  this.onSaveFactura();
                },
                error: (error) => {
                  console.log("arrojo un error");
                  this.onSaveFactura();
                },
                complete: () => {
                  console.log("entro al complete");
                },
              });
          } else {
            this.onSaveFactura();
          }
        }
      });
  }

  onClienteSearch() {
    let data: SearchListtDialogData = {
      titulo: "Buscar Persona",
      query: this.personaSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nombre", nombre: "Nombre", width: "70%" },
        { id: "documento", nombre: "Documento/Ruc", width: "20%" },
      ],
      search: true,
    };
    this.dialog
      .open(SearchListDialogComponent, {
        data,
        height: "50%",
        width: "50%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Persona) => {
        if (res != null) {
          this.onClear();
          this.rucControl.setValue(res.documento);
          this.buscarCliente();
        }
      });
  }

  onClear() {
    this.selectedCliente = null;
    this.clienteDescripcionControl.enable();
    this.direccionControl.enable();
    this.clienteDescripcionControl.setValue(null);
    this.direccionControl.setValue(null);
    this.clienteDescripcionControl.disable();
    this.direccionControl.disable();
    this.rucInput.nativeElement.select();
    this.tributaControl.setValue(true);
  }

  onSaveCliente() {
    if (
      this.rucControl.valid &&
      this.clienteDescripcionControl.valid &&
      this.totalFinalControl.valid
    ) {
      this.onGuardar();
    }
  }

  onSaveFactura() {
    let factura = new FacturaLegal();
    factura.credito = this.creditoControl.value;
    factura.direccion = this.direccionControl.value;
    factura.fecha = this.fechaControl.value;
    factura.nombre = this.clienteDescripcionControl.value;
    factura.ruc = this.rucControl.value;
    factura.caja = this.cajaService?.selectedCaja;
    factura.descuento = this.data?.descuento;
    if (this.selectedCliente?.id != null) {
      factura.cliente = this.selectedCliente;
    }
    let facturaItemInputList: FacturaLegalItemInput[] = [];
    this.dataSource.data.forEach((f) => {
      facturaItemInputList.push(f.toInput());
    });
    this.facturaService
      .onSaveFactura(factura.toInput(), facturaItemInputList)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.matDialogRef.close({
            facturado: true,
            cliente: this.selectedCliente,
          });
        }
      });
  }
}

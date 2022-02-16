import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  OnDestroy,
} from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Observable, Subscription } from "rxjs";
import { convertToObject } from "typescript";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { MonedaBillete } from "../../moneda/moneda-billetes/moneda-billetes.model";
import { Moneda } from "../../moneda/moneda.model";
import { MonedaService } from "../../moneda/moneda.service";
import { ConteoMoneda } from "../conteo-moneda/conteo-moneda.model";
import { Conteo } from "../conteo.model";

export class AdicionarConteoData {
  conteo?: Conteo;
}

export interface AdicionarConteoResponse {
  conteoMonedaList: ConteoMoneda[];
  totalGs: string;
  totalRs: string;
  totalDs: string;
}

@Component({
  selector: "app-adicionar-conteo-dialog",
  templateUrl: "./adicionar-conteo-dialog.component.html",
  styleUrls: ["./adicionar-conteo-dialog.component.scss"],
})
export class AdicionarConteoDialogComponent implements OnInit, OnDestroy {
  @Input() events: Observable<number>;
  @Input() conteo: Observable<Conteo>;
  @Input() focus: Observable<Conteo>;

  @Output()
  onGetConteoMoneda = new EventEmitter<AdicionarConteoResponse>(null);

  @Output()
  totalGsEvent = new EventEmitter<number>(null);

  @Output()
  totalRsEvent = new EventEmitter<number>(null);

  @Output()
  totalDsEvent = new EventEmitter<number>(null);

  @ViewChild("gs500Input", { static: true })
  gs500Input: ElementRef;

  totalRs: number = 0;

  totalGs: number = 0;

  totalDs: number = 0;

  selectedConteo: Conteo;

  guaraniList: MonedaBillete[];
  realList: MonedaBillete[];
  dolarList: MonedaBillete[];
  gsFormGroup: FormGroup;
  rsFormGroup: FormGroup;
  dsFormGroup: FormGroup;
  conteoMonedaList: ConteoMoneda[];
  guarani: Moneda;
  real: Moneda;
  dolar: Moneda;

  eventSub: Subscription;
  conteoSub: Subscription;
  focusSub: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarConteoData,
    private matDialogRef: MatDialogRef<AdicionarConteoDialogComponent>,
    private cargandoDialog: CargandoDialogService,
    private monedaService: MonedaService
  ) {}

  ngOnInit(): void {
    this.cargarMonedas();
    this.createForm();
    this.conteoMonedaList = [];

    this.eventSub = this.events.subscribe((res) => {
      console.log("conteo res: ", res);
      switch (res) {
        case 0:
          setTimeout(() => {
            console.log("deberia de hacer focus en gs500", this.gs500Input);
            this.gs500Input.nativeElement.focus();
          }, 200);
          break;
        case 1:
          this.createMonedaBilletes();
          break;

        default:
          break;
      }
    });

    this.conteoSub = this.conteo.subscribe((res) => {
      if (res != null) {
        this.selectedConteo = res;
        this.cargarDatos();
      }
    });

    this.focusSub = this.focus.subscribe((res) => {
      console.log('set focus to input')
      setTimeout(() => {
        this.gs500Input.nativeElement.focus()
      }, 200);
    });

    console.log("conteo dialog");
  }

  cargarDatos() {
    this.totalGs = 0;
    this.totalDs = 0;
    this.totalRs = 0;
    this.selectedConteo.conteoMonedaList.forEach((e) => {
      let denominacion = e.monedaBilletes.moneda.denominacion;
      let valor = e.monedaBilletes.valor;
      let cantidad = e.cantidad;
      switch (denominacion) {
        case "GUARANI":
          this.totalGs += valor * cantidad;
          this.gsFormGroup.get(`gs${valor}`).setValue(cantidad);
          break;
        case "REAL":
          this.totalRs += valor * cantidad;
          this.rsFormGroup.get(`rs${valor}`.replace(".", "")).setValue(cantidad);
          break;
        case "DOLAR":
          this.totalDs += valor * cantidad;
          this.dsFormGroup.get(`ds${valor}`.replace(".", "")).setValue(cantidad);
          break;

        default:
          break;
      }
      this.gsFormGroup.disable()
      this.rsFormGroup.disable()
      this.dsFormGroup.disable()
      
    });

  }

  createForm() {
    this.gsFormGroup = new FormGroup({
      gs500: new FormControl(),
      gs1000: new FormControl(),
      gs2000: new FormControl(),
      gs5000: new FormControl(),
      gs10000: new FormControl(),
      gs20000: new FormControl(),
      gs50000: new FormControl(),
      gs100000: new FormControl(),
    });

    this.rsFormGroup = new FormGroup({
      rs005: new FormControl(),
      rs025: new FormControl(),
      rs05: new FormControl(),
      rs1: new FormControl(),
      rs2: new FormControl(),
      rs5: new FormControl(),
      rs10: new FormControl(),
      rs20: new FormControl(),
      rs50: new FormControl(),
      rs100: new FormControl(),
      rs200: new FormControl(),
    });

    this.dsFormGroup = new FormGroup({
      ds1: new FormControl(),
      ds5: new FormControl(),
      ds10: new FormControl(),
      ds20: new FormControl(),
      ds50: new FormControl(),
      ds100: new FormControl(),
    });
  }

  cargarMonedas() {
    this.monedaService.onGetAll().subscribe((res) => {
      if (res != null) {
        let monedaList: Moneda[] = res;
        monedaList.forEach((m) => {
          switch (m.denominacion) {
            case "GUARANI":
              this.guarani = m;
              this.guaraniList = m.monedaBilleteList;
              break;
            case "REAL":
              this.real = m;
              this.realList = m.monedaBilleteList;
              break;
            case "DOLAR":
              this.dolar = m;
              this.dolarList = m.monedaBilleteList;
              break;
            default:
              break;
          }
        });
        console.log(res);
      }
    });
  }

  async sumarGs() {
    console.log("sumando gs");
    this.totalGs = 0;
    await this.guaraniList.forEach((e) => {
      let valorMoneda = e.valor;
      let cantidadMoneda = this.gsFormGroup.get(`gs${e.valor}`)?.value;
      if (cantidadMoneda != null) {
        this.totalGs += cantidadMoneda * valorMoneda;
      }
    });
    this.totalGsEvent.emit(this.totalGs)
  }

  async sumarRs() {
    this.totalRs = 0;
    await this.realList.forEach((e) => {
      let valorMoneda = e.valor;
      let cantidadMoneda = this.rsFormGroup.get(
        `rs${e.valor}`.replace(".", "")
      )?.value;
      if (cantidadMoneda != null) {
        this.totalRs += cantidadMoneda * valorMoneda;
      }
    });
    this.totalRsEvent.emit(this.totalRs)
  }

  async sumarDs() {
    this.totalDs = 0;
    await this.dolarList.forEach((e) => {
      let valorMoneda = e.valor;
      let cantidadMoneda = this.dsFormGroup.get(
        `ds${e.valor}`.replace(".", "")
      )?.value;
      if (cantidadMoneda != null) {
        this.totalDs += cantidadMoneda * valorMoneda;
      }
    });
    this.totalDsEvent.emit(this.totalDs)
  }

  createMonedaBilletes() {
    this.conteoMonedaList = [];
    this.guaraniList?.forEach((e) => {
      let conteoMoneda = new ConteoMoneda();
      let cantidad = this.gsFormGroup.get(`gs${e.valor}`)?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    this.realList?.forEach((e) => {
      let conteoMoneda = new ConteoMoneda();
      let cantidad = this.rsFormGroup.get(
        `rs${e.valor}`.replace(".", "")
      )?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    this.dolarList?.forEach((e) => {
      let conteoMoneda = new ConteoMoneda();
      let cantidad = this.dsFormGroup.get(
        `ds${e.valor}`.replace(".", "")
      )?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    setTimeout(() => {
      let response: AdicionarConteoResponse = {
        conteoMonedaList: this.conteoMonedaList,
        totalGs: this.totalGs.toString(),
        totalRs: this.totalRs.toString(),
        totalDs: this.totalDs.toString(),
      };
      this.onGetConteoMoneda.emit(response);
    }, 500);
  }

  ngOnDestroy(): void {
    this.eventSub.unsubscribe();
    this.conteoSub.unsubscribe();
    this.focusSub.unsubscribe();
  }
}

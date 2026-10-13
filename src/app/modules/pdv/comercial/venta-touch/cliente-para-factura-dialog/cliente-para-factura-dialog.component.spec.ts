import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ApolloError } from "@apollo/client/core";
import { NEVER, of, throwError } from "rxjs";
import { TIMEOUT_CONSULTA_MOSTRADOR_MS } from "../../../../../generics/generic-crud.constantes";
import { Cliente } from "../../../../personas/clientes/cliente.model";
import { ClienteService } from "../../../../personas/clientes/cliente.service";
import { PersonaSearchGQL } from "../../../../personas/persona/graphql/personaSearch";
import { esClienteNominado } from "./cliente-nominado";
import { ClienteParaFacturaDialogComponent } from "./cliente-para-factura-dialog.component";

function cliente(id: number, nombre: string, documento: string): Cliente {
  return { id, persona: { id: 1, nombre, documento } } as Cliente;
}

describe("esClienteNominado", () => {
  it("acepta un cliente con id, nombre y documento", () => {
    expect(esClienteNominado(cliente(5, "JUAN PEREZ", "1234567"))).toBeTrue();
  });

  it("rechaza lo que el filial factura sin nombre", () => {
    expect(esClienteNominado(null)).toBeFalse();
    expect(esClienteNominado(cliente(null, "JUAN PEREZ", "1234567"))).toBeFalse();
    expect(esClienteNominado({ id: 5 } as Cliente)).toBeFalse();
    expect(esClienteNominado(cliente(5, "  ", "1234567"))).toBeFalse();
    expect(esClienteNominado(cliente(5, "Sin Nombre", "1234567"))).toBeFalse();
    expect(esClienteNominado(cliente(5, "JUAN PEREZ", ""))).toBeFalse();
    expect(esClienteNominado(cliente(5, "JUAN PEREZ", "0"))).toBeFalse();
  });
});

describe("ClienteParaFacturaDialogComponent", () => {
  let component: ClienteParaFacturaDialogComponent;
  let fixture: ComponentFixture<ClienteParaFacturaDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ClienteParaFacturaDialogComponent>>;
  let clienteService: jasmine.SpyObj<ClienteService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);
    clienteService = jasmine.createSpyObj("ClienteService", ["onGetClientePorPersonaDocumentoDetallado"]);
    dialog = jasmine.createSpyObj("MatDialog", ["open"]);
    await TestBed.configureTestingModule({
      declarations: [ClienteParaFacturaDialogComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { totalGs: 7000000 } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: ClienteService, useValue: clienteService },
        { provide: PersonaSearchGQL, useValue: {} },
        { provide: MatDialog, useValue: dialog },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ClienteParaFacturaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("busca contra el filial y cierra con el cliente encontrado", () => {
    const encontrado = cliente(5, "JUAN PEREZ", "1234567");
    clienteService.onGetClientePorPersonaDocumentoDetallado.and.returnValue(
      of({ cliente: encontrado, warnings: [], errores: [] })
    );
    component.documentoControl.setValue("1234567-8");
    component.onBuscar();
    expect(clienteService.onGetClientePorPersonaDocumentoDetallado).toHaveBeenCalledWith("1234567", false);
    expect(component.cliente).toBe(encontrado);
    component.onAceptar();
    expect(dialogRef.close).toHaveBeenCalledWith(encontrado);
  });

  it("no acepta un cliente sin nombre ni uno que no existe", () => {
    clienteService.onGetClientePorPersonaDocumentoDetallado.and.returnValue(
      of({ cliente: cliente(5, "SIN NOMBRE", "1234567"), warnings: [], errores: [] })
    );
    component.documentoControl.setValue("1234567");
    component.onBuscar();
    expect(component.cliente).toBeNull();
    expect(component.mensaje).toContain("no tiene nombre");

    clienteService.onGetClientePorPersonaDocumentoDetallado.and.returnValue(
      of({ cliente: null, datosBasicos: { razonSocial: "X" }, warnings: [], errores: [] })
    );
    component.onBuscar();
    expect(component.cliente).toBeNull();
    expect(component.mensaje).toContain("No hay un cliente");

    component.onAceptar();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it("un error de red deja el diálogo usable", () => {
    clienteService.onGetClientePorPersonaDocumentoDetallado.and.returnValue(
      throwError(() => new ApolloError({ networkError: new Error("Failed to fetch") }))
    );
    component.documentoControl.setValue("1234567");
    component.onBuscar();
    expect(component.buscando).toBeFalse();
    expect(component.cliente).toBeNull();
    expect(component.mensaje).toContain("No se pudo buscar");
  });

  it("una búsqueda que no responde se corta sola", fakeAsync(() => {
    clienteService.onGetClientePorPersonaDocumentoDetallado.and.returnValue(NEVER);
    component.documentoControl.setValue("1234567");
    component.onBuscar();
    expect(component.buscando).toBeTrue();
    tick(TIMEOUT_CONSULTA_MOSTRADOR_MS + 1);
    expect(component.buscando).toBeFalse();
    expect(component.mensaje).toContain("No se pudo buscar");
  }));

  it("de la búsqueda por nombre solo toma el documento y vuelve a buscar el cliente", () => {
    const encontrado = cliente(5, "JUAN PEREZ", "1234567");
    dialog.open.and.returnValue({ afterClosed: () => of({ id: 999, nombre: "JUAN PEREZ", documento: "1234567" }) } as any);
    clienteService.onGetClientePorPersonaDocumentoDetallado.and.returnValue(
      of({ cliente: encontrado, warnings: [], errores: [] })
    );
    component.onBuscarPorNombre();
    expect(clienteService.onGetClientePorPersonaDocumentoDetallado).toHaveBeenCalledWith("1234567", false);
    expect(component.cliente.id).toBe(5);
  });

  it("cancelar devuelve null", () => {
    component.onCancelar();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});

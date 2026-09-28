import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { InicioSesion } from "./inicio-sesion.model";

describe("InicioSesion.toInput", () => {
  function conSucursal(id: number): InicioSesion {
    const inicioSesion = new InicioSesion();
    const sucursal = new Sucursal();
    sucursal.id = id;
    inicioSesion.sucursal = sucursal;
    return inicioSesion;
  }

  it("no envia la sucursal 0 de central como sucursal propia", () => {
    expect(conSucursal(0).toInput().sucursalId).toBeNull();
  });

  it("envia null cuando no hay sucursal", () => {
    expect(new InicioSesion().toInput().sucursalId).toBeNull();
  });

  it("conserva el id de una sucursal valida", () => {
    expect(conSucursal(14).toInput().sucursalId).toBe(14);
  });
});

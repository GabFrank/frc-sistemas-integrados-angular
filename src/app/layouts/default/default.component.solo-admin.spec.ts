import { BehaviorSubject, of, Subject } from "rxjs";
import { DefaultComponent } from "./default.component";
import { MainService } from "../../main.service";
import { DevolucionComponent } from "../../modules/operaciones/devolucion/devolucion.component";

/** Usuario de la sesión con los roles dados; null = sin sesión. */
function mainServiceCon(usuario: { nickname?: string; roles?: string[] } | null): any {
  return {
    usuarioActual: usuario,
    isServidor: true,
    authenticationSub: new BehaviorSubject<boolean>(null),
    // El real: si cambia la regla de MainService, el spec la sigue.
    tieneAlgunRol: MainService.prototype.tieneAlgunRol,
  };
}

function layout(main: any): DefaultComponent {
  const tabService: any = { tabSub: new Subject() };
  return new DefaultComponent(tabService, null, null, main, null, null, null, null, null);
}

describe("Acciones solo para ADMIN", () => {
  it("«Crear Notificación» sigue al usuario de cada sesión", () => {
    const main = mainServiceCon(null);
    const c = layout(main);
    c.ngOnInit();
    expect(c.esAdmin).toBeFalse();

    main.usuarioActual = { nickname: "MAURO", roles: ["ADMIN"] };
    main.authenticationSub.next(true);
    expect(c.esAdmin).toBeTrue();

    main.usuarioActual = null;
    main.authenticationSub.next(false);
    expect(c.esAdmin).toBeFalse();

    main.usuarioActual = { nickname: "PRUEBANR", roles: ["VER TRANSFERENCIA"] };
    main.authenticationSub.next(true);
    expect(c.esAdmin).toBeFalse();
  });

  it("el engranaje de devoluciones se ve solo con ADMIN", () => {
    const config: any = { onGet: () => of(null) };
    const dashboard: any = new Proxy({}, { get: () => () => of(null) });
    const tabService: any = { onTabReactivada: () => new Subject() };
    const abrir = (usuario) => {
      const c = new DevolucionComponent(tabService, mainServiceCon(usuario), dashboard, config, null, null);
      // Solo interesa el flag: los paneles se cargan aparte.
      (c as any).iniciar = () => {};
      c.ngOnInit();
      return c.esAdmin;
    };
    expect(abrir({ nickname: "PRUEBANR", roles: ["CREAR TRANSFERENCIA"] })).toBeFalse();
    expect(abrir({ nickname: "MAURO", roles: ["ADMIN"] })).toBeTrue();
    expect(abrir({ nickname: "ADMIN", roles: [] })).toBeTrue();
  });
});

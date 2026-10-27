import { BehaviorSubject, of, throwError } from 'rxjs';
import { Moneda } from '../../modules/financiero/moneda/moneda.model';
import { ModuloMoneda } from '../../modules/financiero/moneda/configuracion-moneda-modulo/configuracion-moneda-modulo.model';
import { elegirMonedaEmpresa, MonedaModuloService } from './moneda-modulo.service';

function moneda(id: number, denominacion: string, principal = false): Moneda {
  return Object.assign(new Moneda(), { id, denominacion, principal });
}

describe('elegirMonedaEmpresa', () => {
  it('prefiere la principal, después el guaraní, después la primera', () => {
    const usd = moneda(2, 'DOLAR');
    const pyg = moneda(1, 'GUARANI');
    const brl = moneda(3, 'REAL');
    expect(elegirMonedaEmpresa([usd, pyg, Object.assign(moneda(3, 'REAL'), { principal: true })]).id).toBe(3);
    expect(elegirMonedaEmpresa([usd, pyg, brl])).toBe(pyg);
    expect(elegirMonedaEmpresa([usd, brl])).toBe(usd);
    expect(elegirMonedaEmpresa([])).toBeNull();
    expect(elegirMonedaEmpresa(null)).toBeNull();
  });
});

describe('MonedaModuloService', () => {
  const pyg = moneda(1, 'GUARANI', true);
  const usd = moneda(2, 'DOLAR');

  function crear(opts: { empresa?: any; modulo?: any; lista?: Moneda[] }) {
    const auth = new BehaviorSubject<boolean>(null);
    const empresaGQL = {};
    const moduloGQL = {};
    const generic: any = {
      onCustomQuery: (gql: any) => gql === empresaGQL ? opts.empresa() : opts.modulo(),
    };
    const monedaService: any = { onGetAllEnSegundoPlano: () => of(opts.lista ?? []) };
    const s = new MonedaModuloService({ authenticationSub: auth } as any, generic, monedaService,
      moduloGQL as any, empresaGQL as any);
    return { s, auth };
  }

  it('con el central nuevo usa monedaEmpresa y monedaDeModulo', () => {
    const { s, auth } = crear({ empresa: () => of(pyg), modulo: () => of(usd) });
    auth.next(true);
    expect(s.empresa$.value).toBe(pyg);
    expect(s.contratoNuevo$.value).toBeTrue();
    let recibida: Moneda;
    s.monedaDe(ModuloMoneda.COMPRAS).subscribe((m) => (recibida = m));
    expect(recibida).toBe(usd);
  });

  it('contra un central viejo cae a la principal de la lista', () => {
    const { s, auth } = crear({
      empresa: () => throwError(() => new Error('Validation error')),
      modulo: () => throwError(() => new Error('Validation error')),
      lista: [usd, pyg],
    });
    auth.next(true);
    expect(s.contratoNuevo$.value).toBeFalse();
    expect(s.empresa$.value).toBe(pyg);
    let recibida: Moneda;
    s.monedaDe(ModuloMoneda.PDV, 4).subscribe((m) => (recibida = m));
    expect(recibida).toBe(pyg);
  });

  it('un módulo sin moneda resuelta usa la de la empresa', () => {
    const { s, auth } = crear({ empresa: () => of(pyg), modulo: () => of(null) });
    auth.next(true);
    let recibida: Moneda;
    s.monedaDe(ModuloMoneda.PRECIOS).subscribe((m) => (recibida = m));
    expect(recibida).toBe(pyg);
  });

  it('al cerrar sesión olvida la empresa', () => {
    const { s, auth } = crear({ empresa: () => of(pyg), modulo: () => of(usd) });
    auth.next(true);
    auth.next(false);
    expect(s.empresa$.value).toBeNull();
  });
});

import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { LoginService } from '../../../../login/login.service';
import { TransferirCajaDialogComponent } from './transferir-caja-dialog.component';

/**
 * Transferir caja: validar al destino sin tocar la sesión, transferir con la sesión del dueño y recién
 * después pasar la sesión al destino (#635).
 */
describe('TransferirCajaDialogComponent', () => {
  let loginService: jasmine.SpyObj<LoginService>;
  let cajaService: any;
  let notificaciones: any;
  let dialogRef: any;
  let tabService: any;
  let mainService: any;
  let loginDialog: any;
  let dialogo: TransferirCajaDialogComponent;

  beforeEach(() => {
    loginService = jasmine.createSpyObj('LoginService', ['verificarCredenciales', 'login']);
    cajaService = jasmine.createSpyObj('CajaService', ['onTransferirCaja']);
    notificaciones = jasmine.createSpyObj('Notificaciones', ['openWarn', 'openAlgoSalioMal', 'openSucess']);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    tabService = jasmine.createSpyObj('TabService', ['removeCurrentTab', 'removeAllTabs']);
    mainService = jasmine.createSpyObj('MainService', ['logout']);
    loginDialog = jasmine.createSpyObj('LoginDialogService', ['openLoginDialog']);
    dialogo = new TransferirCajaDialogComponent({ cajaId: 50 }, dialogRef, cajaService, notificaciones,
      loginService, tabService, mainService, loginDialog);
    dialogo.usuarioControl.setValue('DESTINO');
    dialogo.passwordControl.setValue('CLAVE');
  });

  it('con credenciales mal no transfiere y muestra el motivo', () => {
    loginService.verificarCredenciales.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 401, error: { message: 'Usuario inactivo' } })));

    dialogo.onConfirm();

    expect(cajaService.onTransferirCaja).not.toHaveBeenCalled();
    expect(loginService.login).not.toHaveBeenCalled();
    expect(notificaciones.openAlgoSalioMal).toHaveBeenCalledWith('Usuario inactivo');
    expect(dialogo.enCurso).toBeFalse();
  });

  it('transfiere con la sesión actual y recién después inicia sesión con el destino', () => {
    const orden: string[] = [];
    loginService.verificarCredenciales.and.callFake(() => { orden.push('verificar'); return of(7); });
    cajaService.onTransferirCaja.and.callFake(() => { orden.push('transferir'); return of(true); });
    loginService.login.and.callFake(() => { orden.push('login'); return of({ usuario: { id: 7 } as any }); });

    dialogo.onConfirm();

    expect(orden).toEqual(['verificar', 'transferir', 'login']);
    expect(cajaService.onTransferirCaja).toHaveBeenCalledWith(50, 7);
    expect(loginService.login).toHaveBeenCalledWith('DESTINO', 'CLAVE');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(mainService.logout).not.toHaveBeenCalled();
  });

  it('si la transferencia se rechaza no cambia la sesión', () => {
    loginService.verificarCredenciales.and.returnValue(of(7));
    cajaService.onTransferirCaja.and.returnValue(throwError(() => ({ graphQLErrors: [{ message: 'El usuario destino ya tiene una caja abierta' }] })));

    dialogo.onConfirm();

    expect(loginService.login).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(dialogo.enCurso).toBeFalse();
  });

  it('si el servidor responde que no transfirió no cambia la sesión', () => {
    loginService.verificarCredenciales.and.returnValue(of(7));
    cajaService.onTransferirCaja.and.returnValue(of(null));

    dialogo.onConfirm();

    expect(loginService.login).not.toHaveBeenCalled();
    expect(notificaciones.openWarn).toHaveBeenCalled();
    expect(dialogo.enCurso).toBeFalse();
  });

  it('un segundo Enter mientras corre no dispara otra transferencia', () => {
    const pendiente = new Subject<number>();
    loginService.verificarCredenciales.and.returnValue(pendiente);

    dialogo.onConfirm();
    dialogo.onConfirm();

    expect(loginService.verificarCredenciales).toHaveBeenCalledTimes(1);
  });

  it('si el login del destino falla con la caja ya transferida, cierra la sesión', () => {
    loginService.verificarCredenciales.and.returnValue(of(7));
    cajaService.onTransferirCaja.and.returnValue(of(true));
    loginService.login.and.returnValue(of({ usuario: null }));

    dialogo.onConfirm();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(mainService.logout).toHaveBeenCalled();
    expect(tabService.removeAllTabs).toHaveBeenCalled();
    expect(loginDialog.openLoginDialog).toHaveBeenCalled();
  });
});

describe('LoginService.verificarCredenciales', () => {
  let http: any;
  let servicio: LoginService;

  beforeEach(() => {
    http = jasmine.createSpyObj('HttpClient', ['post']);
    const config = { getConfig: () => ({ isLocal: true, serverIp: 'localhost', serverPort: '8082' }) };
    servicio = new LoginService(http, null, null, null, null, config as any, null);
    localStorage.setItem('token', 'TOKEN-DEL-DUENIO');
  });

  afterEach(() => localStorage.removeItem('token'));

  it('devuelve el id sin tocar la sesión', (done) => {
    http.post.and.returnValue(of({ token: 'TOKEN-DEL-DESTINO', usuarioId: 7 }));
    servicio.verificarCredenciales('DESTINO', 'CLAVE').subscribe(id => {
      expect(id).toBe(7);
      expect(localStorage.getItem('token')).toBe('TOKEN-DEL-DUENIO');
      expect(http.post.calls.mostRecent().args[0]).toContain('8082/login');
      done();
    });
  });

  it('200 sin token: falla con el aviso del filial', (done) => {
    http.post.and.returnValue(of({ aviso: 'Usuario inactivo, contacte al administrador' }));
    servicio.verificarCredenciales('DESTINO', 'CLAVE').subscribe({
      error: (e) => {
        expect(e.error.message).toBe('Usuario inactivo, contacte al administrador');
        done();
      }
    });
  });

  it('token sin usuarioId: falla sin devolver un id vacío', (done) => {
    http.post.and.returnValue(of({ token: 'X' }));
    servicio.verificarCredenciales('DESTINO', 'CLAVE').subscribe({
      error: (e) => {
        expect(e.status).toBe(500);
        done();
      }
    });
  });

  it('servidor caído: mensaje de conexión, no de credenciales', (done) => {
    http.post.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    servicio.verificarCredenciales('DESTINO', 'CLAVE').subscribe({
      error: (e) => {
        expect(e.error.message).toContain('conexión');
        done();
      }
    });
  });
});

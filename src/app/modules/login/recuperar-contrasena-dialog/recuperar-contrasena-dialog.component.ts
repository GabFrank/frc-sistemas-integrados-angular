import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { validarFecha } from '../../../commons/core/utils/dateUtils';
import { RecuperacionContrasenaService } from '../recuperacion-contrasena.service';
import { EstadoRecuperacion } from '../recuperacion-contrasena.model';

export interface RecuperarContrasenaDialogData {
  /** Lo que el usuario ya escribió en el login. */
  nickname?: string;
}

type Paso = 'identidad' | 'codigo' | 'sin-correo' | 'solicitud-creada' | 'consultar' | 'nueva' | 'listo';

const LARGO_MINIMO = 6;

function fechaValida(control: AbstractControl): ValidationErrors | null {
  const v: string = control.value;
  if (!v) return null;
  return /^\d{2}\/\d{2}\/\d{4}$/.test(v) && validarFecha(v) ? null : { fecha: true };
}

function contrasenasIguales(group: AbstractControl): ValidationErrors | null {
  const nueva = group.get('nueva')?.value;
  const repetir = group.get('repetir')?.value;
  return nueva && repetir && nueva !== repetir ? { distintas: true } : null;
}

/**
 * "¿Olvidó su contraseña?".
 *
 * - Con correo registrado: le llega un código de 6 dígitos y con él elige la contraseña.
 * - Sin correo: arma una solicitud que aprueba RRHH; la manda por WhatsApp escaneando un QR con
 *   cualquier cámara, y la termina con el código secreto que ve una sola vez en esta pantalla.
 *
 * Las reglas (captcha, bloqueos, vencimientos) son del central; acá solo se muestran sus mensajes.
 */
@UntilDestroy()
@Component({
  selector: 'app-recuperar-contrasena-dialog',
  templateUrl: './recuperar-contrasena-dialog.component.html',
  styleUrls: ['./recuperar-contrasena-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarContrasenaDialogComponent implements OnInit {

  paso: Paso = 'identidad';
  titulo = 'Recuperar contraseña';
  cargando = false;
  error: string = null;
  aviso: string = null;

  captchaId: string = null;
  captchaSrc: string = null;

  identidadForm = new FormGroup({
    nickname: new FormControl<string>(null, Validators.required),
    documento: new FormControl<string>(null, Validators.required),
    nacimiento: new FormControl<string>(null, [Validators.required, fechaValida]),
    captcha: new FormControl<string>(null, [Validators.required, Validators.minLength(5)]),
  });

  codigoControl = new FormControl<string>(null, [Validators.required, Validators.pattern(/^\d{6}$/)]);

  solicitudForm = new FormGroup({
    telefono: new FormControl<string>(null, [Validators.required, Validators.pattern(/^[0-9+ ()-]{6,20}$/)]),
    email: new FormControl<string>(null, Validators.email),
    observacion: new FormControl<string>(null, Validators.maxLength(500)),
  });

  consultarForm = new FormGroup({
    solicitudId: new FormControl<number>(null, Validators.required),
    codigo: new FormControl<string>(null, Validators.required),
    documento: new FormControl<string>(null, Validators.required),
  });

  nuevaForm = new FormGroup({
    nueva: new FormControl<string>(null, [Validators.required, Validators.minLength(LARGO_MINIMO), Validators.maxLength(50)]),
    repetir: new FormControl<string>(null, Validators.required),
  }, { validators: contrasenasIguales });

  ocultarContrasena = true;
  largoMinimo = LARGO_MINIMO;

  // Lo que devolvió el central, ya listo para mostrar.
  emailEnmascarado: string = null;
  minutosVigencia: number = null;
  verificacionToken: string = null;
  solicitudId: number = null;
  codigoSecreto: string = null;
  whatsappUrl: string = null;
  horasParaAprobar: number = null;
  estado: EstadoRecuperacion = null;
  esRechazada = false;

  /** Con qué se va a restablecer: el código del correo o el secreto de la solicitud a RRHH. */
  private codigoVigente: string = null;
  private documentoVigente: string = null;

  constructor(
    private service: RecuperacionContrasenaService,
    private dialogRef: MatDialogRef<RecuperarContrasenaDialogComponent>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private data: RecuperarContrasenaDialogData,
  ) { }

  ngOnInit(): void {
    this.identidadForm.controls.nickname.setValue(this.data?.nickname?.trim() || null);
    this.onNuevoCaptcha();
  }

  // ------------------------------------------------------------------ paso 1: identidad

  onNuevoCaptcha(): void {
    this.identidadForm.controls.captcha.reset();
    this.captchaSrc = null;
    this.service.captcha().pipe(untilDestroyed(this)).subscribe({
      next: (c) => {
        this.captchaId = c.id;
        this.captchaSrc = 'data:image/png;base64,' + c.imagen;
        this.cdr.markForCheck();
      },
      error: (e: Error) => this.mostrarError(e),
    });
  }

  /** Va armando dd/mm/aaaa mientras escribe, para no depender del formato del sistema. */
  onEscribirFecha(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 8);
    let texto = digitos;
    if (digitos.length > 4) texto = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
    else if (digitos.length > 2) texto = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    if (texto !== input.value) {
      this.identidadForm.controls.nacimiento.setValue(texto);
    }
  }

  onVerificar(): void {
    if (this.cargando) return;
    if (this.identidadForm.invalid) {
      this.identidadForm.markAllAsTouched();
      const c = this.identidadForm.controls;
      this.avisarInvalido(
        c.nickname.invalid ? 'Ingrese su usuario.'
          : c.documento.invalid ? 'Ingrese su número de cédula.'
          : c.nacimiento.invalid ? 'Ingrese su fecha de nacimiento como DD/MM/AAAA.'
          : 'Escriba los 5 caracteres de la imagen.');
      return;
    }
    const v = this.identidadForm.getRawValue();
    const [dia, mes, anio] = v.nacimiento.split('/');
    this.documentoVigente = v.documento;
    this.ejecutar(this.service.verificar(v.nickname.trim(), v.documento, `${anio}-${mes}-${dia}`,
      this.captchaId, v.captcha.trim()), (r) => {
        if (r.tipo === 'CORREO') {
          this.solicitudId = r.solicitudId;
          this.emailEnmascarado = r.emailEnmascarado;
          this.minutosVigencia = r.minutosVigencia;
          this.codigoControl.reset();
          this.irA('codigo');
        } else {
          this.verificacionToken = r.verificacionToken;
          this.irA('sin-correo');
        }
      }, () => this.onNuevoCaptcha());
  }

  // ------------------------------------------------------------------ con correo

  onVerificarCodigo(): void {
    if (this.cargando) return;
    if (this.codigoControl.invalid) {
      this.codigoControl.markAsTouched();
      this.avisarInvalido('El código tiene 6 dígitos.');
      return;
    }
    const codigo = this.codigoControl.value;
    this.ejecutar(this.service.consultar(this.solicitudId, codigo, null), (estado) => {
      this.codigoVigente = codigo;
      this.mostrarEstado(estado);
    });
  }

  /** Un código nuevo exige pasar otra vez por el captcha. */
  onReenviarCodigo(): void {
    this.identidadForm.controls.captcha.reset();
    this.irA('identidad');
    this.onNuevoCaptcha();
  }

  // ------------------------------------------------------------------ sin correo: solicitud a RRHH

  onEnviarSolicitud(): void {
    if (this.cargando) return;
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      const c = this.solicitudForm.controls;
      this.avisarInvalido(
        c.telefono.invalid ? 'Ingrese un teléfono válido.'
          : c.email.invalid ? 'El correo no es válido.'
          : 'La observación no puede superar los 500 caracteres.');
      return;
    }
    const v = this.solicitudForm.getRawValue();
    this.ejecutar(this.service.solicitudRrhh(this.verificacionToken, v.telefono, v.email?.trim() || null,
      v.observacion?.trim() || null), (s) => {
        this.solicitudId = s.solicitudId;
        this.codigoSecreto = s.codigoSecreto;
        this.horasParaAprobar = s.horasParaAprobar;
        // Sin número: WhatsApp abre la lista de chats y el usuario elige a quién mandarlo.
        this.whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(s.mensajeWhatsapp);
        this.verificacionToken = null;
        this.irA('solicitud-creada');
      });
  }

  onCopiarCodigoSecreto(): void {
    navigator.clipboard?.writeText(this.codigoSecreto).then(() => {
      this.aviso = 'Código copiado.';
      this.cdr.markForCheck();
    });
  }

  /** De la solicitud recién creada a consultar su estado, con los datos ya cargados. */
  onIrAConsultarCreada(): void {
    this.consultarForm.setValue({
      solicitudId: this.solicitudId,
      codigo: this.codigoSecreto,
      documento: this.documentoVigente,
    });
    this.irA('consultar');
  }

  onIrAConsultar(): void {
    this.consultarForm.reset();
    this.irA('consultar');
  }

  onConsultar(): void {
    if (this.cargando) return;
    if (this.consultarForm.invalid) {
      this.consultarForm.markAllAsTouched();
      this.avisarInvalido('Complete el N° de solicitud, el código secreto y su cédula.');
      return;
    }
    const v = this.consultarForm.getRawValue();
    this.ejecutar(this.service.consultar(v.solicitudId, v.codigo, v.documento), (estado) => {
      this.solicitudId = v.solicitudId;
      this.codigoVigente = v.codigo;
      this.documentoVigente = v.documento;
      this.mostrarEstado(estado);
    });
  }

  // ------------------------------------------------------------------ contraseña nueva

  onRestablecer(): void {
    if (this.cargando) return;
    if (this.nuevaForm.invalid) {
      this.nuevaForm.markAllAsTouched();
      const c = this.nuevaForm.controls;
      this.avisarInvalido(
        c.nueva.hasError('required') ? 'Escriba la contraseña nueva.'
          : c.nueva.hasError('minlength') ? `La contraseña debe tener al menos ${LARGO_MINIMO} caracteres.`
          : c.nueva.hasError('maxlength') ? 'La contraseña no puede superar los 50 caracteres.'
          : c.repetir.invalid ? 'Repita la contraseña.'
          : 'Las contraseñas no coinciden.');
      return;
    }
    this.ejecutar(this.service.restablecer(this.solicitudId, this.codigoVigente, this.documentoVigente,
      this.nuevaForm.controls.nueva.value), (estado) => {
        this.estado = estado;
        this.codigoVigente = null;
        this.irA('listo');
      });
  }

  onAlternarContrasena(): void {
    this.ocultarContrasena = !this.ocultarContrasena;
  }

  onVolverAlInicio(): void {
    this.irA('identidad');
    this.onNuevoCaptcha();
  }

  onCerrar(): void {
    this.dialogRef.close(this.paso === 'listo' ? this.identidadForm.controls.nickname.value : null);
  }

  // ------------------------------------------------------------------ utilitarios

  private mostrarEstado(estado: EstadoRecuperacion): void {
    this.estado = estado;
    this.esRechazada = estado.estado === 'RECHAZADA';
    if (estado.puedeRestablecer) {
      this.nuevaForm.reset();
      this.aviso = estado.mensaje;
      this.irA('nueva', false);
    } else {
      this.error = null;
      this.aviso = null;
      this.cdr.markForCheck();
    }
  }

  private irA(paso: Paso, limpiarAviso = true): void {
    this.paso = paso;
    this.error = null;
    if (limpiarAviso) this.aviso = null;
    this.titulo = {
      'identidad': 'Recuperar contraseña',
      'codigo': 'Ingrese el código',
      'sin-correo': 'Solicitud a RRHH',
      'solicitud-creada': 'Solicitud registrada',
      'consultar': 'Consultar solicitud',
      'nueva': 'Nueva contraseña',
      'listo': 'Contraseña restablecida',
    }[paso];
    if (paso !== 'consultar') this.estado = null;
    this.cdr.markForCheck();
  }

  private ejecutar<T>(obs: Observable<T>, ok: (r: T) => void, alFallar?: () => void): void {
    this.cargando = true;
    this.error = null;
    this.cdr.markForCheck();
    obs.pipe(
      untilDestroyed(this),
      finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: ok,
      error: (e: Error) => {
        this.mostrarError(e);
        alFallar?.();
      },
    });
  }

  private avisarInvalido(mensaje: string): void {
    this.error = mensaje;
    this.cdr.markForCheck();
  }

  private mostrarError(e: Error): void {
    this.error = e?.message || 'No se pudo procesar el pedido.';
    this.cdr.markForCheck();
  }
}

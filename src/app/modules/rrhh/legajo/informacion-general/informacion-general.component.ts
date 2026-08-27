import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';

import { dateToString, stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

import { Persona } from '../../../personas/persona/persona.model';
import { PersonaService } from '../../../personas/persona/persona.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioInput } from '../../../personas/funcionarios/funcionario-input.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { Ciudad } from '../../../general/ciudad/ciudad.model';
import { CiudadService } from '../../../general/ciudad/ciudad.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';

import { LegajoService } from '../legajo.service';
import { FuncionarioDocumento } from '../legajo.model';

/**
 * Foto de perfil — se guarda como FuncionarioDocumento con tipo dedicado 'FOTO_PERFIL'.
 * El botón "Cambiar foto" dispara directamente el selector de archivos del SO (input file
 * oculto); al elegir imagen se sube en un solo paso, sin diálogo ni selección manual de tipo.
 * Fallback de visualización, en orden: documento FOTO_PERFIL más reciente -> funcionario.imagenPrincipal
 * -> avatar genérico.
 */
const FOTO_PERFIL_TIPO = 'FOTO_PERFIL';
const AVATAR_DEFAULT = 'assets/avatar-3x4.png';

@UntilDestroy()
@Component({
  selector: 'app-informacion-general',
  templateUrl: './informacion-general.component.html',
  styleUrls: ['./informacion-general.component.scss']
})
export class InformacionGeneralComponent implements OnInit, OnChanges {

  @Input() funcionarioId: number;
  @Output() guardado = new EventEmitter<number>();
  // Notifica al legajo padre la foto vigente (data URL) para pintar el avatar de la cabecera.
  @Output() fotoCambiada = new EventEmitter<string>();

  // ---- Persona ----
  documentoControl = new FormControl(null, Validators.required);
  nombreControl = new FormControl(null, Validators.required);
  nacimientoControl = new FormControl(null);
  sexoControl = new FormControl(null);
  direccionControl = new FormControl(null);
  telefonoControl = new FormControl(null);
  emailControl = new FormControl(null);
  ciudadControl = new FormControl(null);

  // ---- Datos laborales ----
  fechaIngresoControl = new FormControl(null);
  sucursalControl = new FormControl(null, Validators.required);
  supervisadoPorIdControl = new FormControl(null);
  activoControl = new FormControl(true);
  fasePruebaControl = new FormControl(true);
  diaristaControl = new FormControl(false);
  codigoInternoControl = new FormControl(null);

  // ---- IPS ----
  ipsActivoControl = new FormControl(false);
  numeroIpsControl = new FormControl({ value: null, disabled: true });
  fechaIngresoIpsControl = new FormControl({ value: null, disabled: true });

  // ---- Cuenta bancaria ----
  cuentaBancariaControl = new FormControl(null);

  // ---- Contacto de emergencia ----
  contactoEmergenciaNombreControl = new FormControl(null);
  contactoEmergenciaTelefonoControl = new FormControl(null);

  formGroup: FormGroup;

  sexoOptions: { value: string; label: string }[] = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' }
  ];

  sucursalList: Sucursal[] = [];
  ciudadList: Ciudad[] = [];

  // Estado precalculado para el template (regla del proyecto: nada de funciones/getters en HTML)
  esEdicion = false;
  tituloFormulario = 'Nuevo funcionario';
  puedeSubirFoto = false;
  subiendoFoto = false;
  ipsActivo = false;
  fotoPerfilSrc = AVATAR_DEFAULT;
  hoy = new Date();

  // Estado interno de guardado
  private personaActual: Persona = null;
  private personaId: number = null;
  private funcionarioActual: Funcionario = null;

  constructor(
    private personaService: PersonaService,
    private funcionarioService: FuncionarioService,
    private ciudadService: CiudadService,
    private sucursalService: SucursalService,
    private legajoService: LegajoService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      documento: this.documentoControl,
      nombre: this.nombreControl,
      sucursal: this.sucursalControl
    });

    this.ipsActivoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(v => this.aplicarEstadoIps(!!v));

    this.cargarCatalogos();
    this.cargarFuncionario();
    this.actualizarPrecomputados();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['funcionarioId'] && !changes['funcionarioId'].firstChange) {
      this.cargarFuncionario();
      this.actualizarPrecomputados();
    }
  }

  private actualizarPrecomputados(): void {
    this.esEdicion = this.funcionarioId != null;
    this.tituloFormulario = this.esEdicion ? 'Editar funcionario' : 'Nuevo funcionario';
    this.puedeSubirFoto = this.esEdicion;
  }

  private aplicarEstadoIps(activo: boolean): void {
    this.ipsActivo = activo;
    if (activo) {
      this.numeroIpsControl.enable({ emitEvent: false });
      this.fechaIngresoIpsControl.enable({ emitEvent: false });
    } else {
      this.numeroIpsControl.disable({ emitEvent: false });
      this.fechaIngresoIpsControl.disable({ emitEvent: false });
    }
  }

  private cargarCatalogos(): void {
    forkJoin({
      sucursales: this.sucursalService.onGetAllSucursales(),
      ciudades: this.ciudadService.getAllCiudades()
    }).pipe(untilDestroyed(this)).subscribe(res => {
      this.sucursalList = res.sucursales || [];
      this.ciudadList = res.ciudades || [];
    });
  }

  private cargarFuncionario(): void {
    if (this.funcionarioId == null) {
      this.limpiarFormulario();
      return;
    }
    this.funcionarioService.onGetFuncionarioById(this.funcionarioId)
      .pipe(untilDestroyed(this))
      .subscribe((f: Funcionario) => {
        if (f == null) { return; }
        this.precargar(f);
        this.cargarFoto();
      });
  }

  private precargar(f: Funcionario): void {
    this.funcionarioActual = f;
    this.personaActual = f.persona;
    this.personaId = f.persona?.id;

    this.documentoControl.setValue(f.persona?.documento);
    this.nombreControl.setValue(f.persona?.nombre);
    this.nacimientoControl.setValue(f.persona?.nacimiento ? stringToLocalDate(f.persona.nacimiento as any) : null);
    this.sexoControl.setValue(f.persona?.sexo);
    this.direccionControl.setValue(f.persona?.direccion);
    this.telefonoControl.setValue(f.persona?.telefono);
    this.emailControl.setValue(f.persona?.email);
    this.ciudadControl.setValue(f.persona?.ciudad?.id);

    this.fechaIngresoControl.setValue(f.fechaIngreso ? stringToLocalDate(f.fechaIngreso as any) : null);
    this.sucursalControl.setValue(f.sucursal?.id);
    this.supervisadoPorIdControl.setValue(f.supervisadoPor?.id);
    this.activoControl.setValue(f.activo ?? true);
    this.fasePruebaControl.setValue(f.fasePrueba ?? true);
    this.diaristaControl.setValue(f.diarista ?? false);
    this.codigoInternoControl.setValue(f.codigoInterno);

    this.ipsActivoControl.setValue(!!f.ipsActivo);
    this.aplicarEstadoIps(!!f.ipsActivo);
    this.numeroIpsControl.setValue(f.numeroIps);
    this.fechaIngresoIpsControl.setValue(f.fechaIngresoIps ? stringToLocalDate(f.fechaIngresoIps as any) : null);

    this.cuentaBancariaControl.setValue(f.cuentaBancaria);
    this.contactoEmergenciaNombreControl.setValue(f.contactoEmergenciaNombre);
    this.contactoEmergenciaTelefonoControl.setValue(f.contactoEmergenciaTelefono);

    this.fotoPerfilSrc = f.imagenPrincipal || AVATAR_DEFAULT;
    this.actualizarPrecomputados();
  }

  private limpiarFormulario(): void {
    this.funcionarioActual = null;
    this.personaActual = null;
    this.personaId = null;

    this.documentoControl.reset();
    this.nombreControl.reset();
    this.nacimientoControl.reset();
    this.sexoControl.reset();
    this.direccionControl.reset();
    this.telefonoControl.reset();
    this.emailControl.reset();
    this.ciudadControl.reset();

    this.fechaIngresoControl.reset();
    this.sucursalControl.reset();
    this.supervisadoPorIdControl.reset();
    this.activoControl.setValue(true);
    this.fasePruebaControl.setValue(true);
    this.diaristaControl.setValue(false);
    this.codigoInternoControl.reset();

    this.ipsActivoControl.setValue(false);
    this.numeroIpsControl.reset();
    this.fechaIngresoIpsControl.reset();

    this.cuentaBancariaControl.reset();
    this.contactoEmergenciaNombreControl.reset();
    this.contactoEmergenciaTelefonoControl.reset();

    this.fotoPerfilSrc = AVATAR_DEFAULT;
  }

  /** Busca una persona por documento; si existe, precarga sus datos. Si no, se completa como persona nueva. */
  onBuscarPersona(): void {
    const documento = (this.documentoControl.value || '').toString().trim();
    if (!documento) {
      this.notificacion.openWarn('Ingrese un documento para buscar');
      return;
    }
    this.personaService.onGetPorDocumento(documento).pipe(untilDestroyed(this)).subscribe((p: Persona) => {
      if (p != null) {
        this.personaActual = p;
        this.personaId = p.id;
        this.nombreControl.setValue(p.nombre);
        this.nacimientoControl.setValue(p.nacimiento ? stringToLocalDate(p.nacimiento as any) : null);
        this.sexoControl.setValue(p.sexo);
        this.direccionControl.setValue(p.direccion);
        this.telefonoControl.setValue(p.telefono);
        this.emailControl.setValue(p.email);
        this.ciudadControl.setValue(p.ciudad?.id);
        this.notificacion.openSucess('Persona encontrada, datos precargados');
      } else {
        this.personaActual = null;
        this.personaId = null;
        this.notificacion.openWarn('No se encontró una persona con ese documento. Complete los datos para crear una nueva.');
      }
    });
  }

  private cargarFoto(): void {
    this.legajoService.onGetDocumentos(this.funcionarioId).pipe(untilDestroyed(this)).subscribe((docs: FuncionarioDocumento[]) => {
      const candidatos = (docs || []).filter(d => !d.anulado && d.tipo === FOTO_PERFIL_TIPO);
      if (candidatos.length === 0) { return; }
      candidatos.sort((a, b) => {
        const fa = new Date((a.fechaSubida || a.creadoEn) as any).getTime();
        const fb = new Date((b.fechaSubida || b.creadoEn) as any).getTime();
        return fb - fa;
      });
      const ultimo = candidatos[0];
      this.legajoService.onGetDocumentoContenido(ultimo.id).pipe(untilDestroyed(this)).subscribe((contenido: string) => {
        if (contenido) {
          this.fotoPerfilSrc = contenido.startsWith('data:')
            ? contenido
            : 'data:' + (ultimo.mimeType || 'image/png') + ';base64,' + contenido;
          this.fotoCambiada.emit(this.fotoPerfilSrc);
        }
      });
    });
  }

  /** El input file oculto abre el selector del SO; al elegir imagen se sube en un solo paso. */
  onFotoSeleccionada(event: any): void {
    const file: File = event?.target?.files?.[0];
    if (file == null) { return; }
    // Se limpia el input para que elegir el mismo archivo dos veces vuelva a disparar change.
    if (event?.target) { event.target.value = ''; }

    if (this.funcionarioId == null) {
      this.notificacion.openWarn('Guarde el funcionario antes de subir la foto.');
      return;
    }
    if (!file.type || !file.type.startsWith('image/')) {
      this.notificacion.openWarn('Seleccione un archivo de imagen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const contenidoBase64 = reader.result as string;
      // Preview inmediato mientras persiste.
      this.fotoPerfilSrc = contenidoBase64;
      this.fotoCambiada.emit(this.fotoPerfilSrc);
      this.subiendoFoto = true;
      this.legajoService.onSaveDocumento({
        funcionarioId: this.funcionarioId,
        tipo: FOTO_PERFIL_TIPO,
        nombreArchivo: file.name,
        contenidoBase64,
        mimeType: file.type,
        tamanoBytes: file.size,
        vencimiento: null,
        observacion: null
      }).pipe(untilDestroyed(this)).subscribe({
        // Sin el handler de error el botón se quedaba en "Subiendo…" para siempre.
        error: () => { this.subiendoFoto = false; },
        next: (doc: FuncionarioDocumento) => {
          this.subiendoFoto = false;
          if (doc == null) { return; }
          this.cargarFoto();
        },
      });
    };
    reader.readAsDataURL(file);
  }

  private up(valor: any): string {
    return valor != null ? valor.toString().trim().toUpperCase() : null;
  }

  onGuardar(): void {
    this.documentoControl.markAsTouched();
    this.nombreControl.markAsTouched();
    this.sucursalControl.markAsTouched();

    if (this.documentoControl.invalid || this.nombreControl.invalid || this.sucursalControl.invalid) {
      this.notificacion.openWarn('Complete los campos obligatorios: documento, nombre y sucursal.');
      return;
    }

    const persona = new Persona();
    if (this.personaActual != null) {
      Object.assign(persona, this.personaActual);
    }
    persona.nombre = this.up(this.nombreControl.value);
    persona.documento = this.up(this.documentoControl.value);
    persona.nacimiento = this.nacimientoControl.value;
    persona.sexo = this.sexoControl.value;
    persona.direccion = this.up(this.direccionControl.value);
    persona.telefono = this.telefonoControl.value;
    persona.email = this.up(this.emailControl.value);
    const ciudadSeleccionada = (this.ciudadList || []).find(c => c.id === this.ciudadControl.value);
    if (ciudadSeleccionada != null) { persona.ciudad = ciudadSeleccionada; }
    persona.isFuncionario = true;

    const personaInput = persona.toInput();
    personaInput.id = this.personaId;

    this.personaService.onSavePersona(personaInput).pipe(untilDestroyed(this)).subscribe((personaGuardada: Persona) => {
      if (personaGuardada == null) { return; }
      this.personaId = personaGuardada.id;
      this.personaActual = personaGuardada;

      const input = new FuncionarioInput();
      input.id = this.funcionarioId;
      input.personaId = this.personaId;
      input.sucursalId = this.sucursalControl.value;
      input.fechaIngreso = dateToString(this.fechaIngresoControl.value, 'yyyy-MM-dd');
      input.supervisadoPorId = this.supervisadoPorIdControl.value;
      input.activo = this.activoControl.value;
      input.fasePrueba = this.fasePruebaControl.value;
      input.diarista = this.diaristaControl.value;
      input.codigoInterno = this.up(this.codigoInternoControl.value);
      input.ipsActivo = this.ipsActivoControl.value;
      input.numeroIps = this.ipsActivoControl.value ? this.up(this.numeroIpsControl.value) : null;
      input.fechaIngresoIps = this.ipsActivoControl.value ? dateToString(this.fechaIngresoIpsControl.value, 'yyyy-MM-dd') : null;
      input.cuentaBancaria = this.up(this.cuentaBancariaControl.value);
      input.contactoEmergenciaNombre = this.up(this.contactoEmergenciaNombreControl.value);
      input.contactoEmergenciaTelefono = this.contactoEmergenciaTelefonoControl.value;

      // Este formulario no gestiona cargo/sueldo/credito/horario (tienen sus propias tabs en
      // el legajo, vía CambioCargoDialogComponent/CambioSalarioDialogComponent). Si ya existe un
      // funcionario cargado, preservamos esos valores para no pisarlos al guardar desde acá.
      if (this.funcionarioActual != null) {
        input.cargoId = this.funcionarioActual.cargo?.id;
        input.credito = this.funcionarioActual.credito;
        input.sueldo = this.funcionarioActual.sueldo;
        input.horarioId = this.funcionarioActual.horario?.id;
      }

      this.funcionarioService.onSaveFuncionario(input).pipe(untilDestroyed(this)).subscribe((funcionarioGuardado: Funcionario) => {
        if (funcionarioGuardado == null) { return; }
        // No se dispara un snackbar adicional acá: GenericCrudService.onSave ya muestra
        // "Guardado con éxito" automáticamente en cada mutación (persona y funcionario),
        // por lo que un tercer aviso manual sería redundante.
        this.guardado.emit(funcionarioGuardado.id);
      });
    });
  }
}

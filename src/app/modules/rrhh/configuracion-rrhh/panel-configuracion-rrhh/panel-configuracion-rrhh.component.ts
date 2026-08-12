import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ConfiguracionRrhh } from '../configuracion-rrhh.model';
import { ConfiguracionRrhhService } from '../configuracion-rrhh.service';
import { ConfigInfoDialogComponent } from '../config-info-dialog/config-info-dialog.component';
import { AjusteSalarioMinimoDialogComponent } from '../ajuste-salario-minimo-dialog/ajuste-salario-minimo-dialog.component';
import { CONFIGURACION_RRHH_HELP } from '../configuracion-rrhh-help';
import {
  CONFIGURACION_RRHH_CAMPO_META, CONFIGURACION_RRHH_SECCIONES, ConfigCampoMeta
} from '../configuracion-rrhh-catalogo';

interface CampoVM {
  clave: string;
  label: string;
  ayuda: string;
  meta: ConfigCampoMeta;
  control: FormControl;
  config: ConfiguracionRrhh;
  guardando: boolean;
}

interface SeccionVM {
  titulo: string;
  icono: string;
  campos: CampoVM[];
}

/**
 * Configuración RRHH — pantalla curada (no CRUD). Las claves son un catálogo fijo
 * de desarrollo; el usuario final solo AJUSTA valores, agrupados en pestañas por
 * sección y con el widget apropiado (número, %, Gs, toggle, mes). No permite crear
 * ni eliminar claves. Preserva la cascada guiada del salario mínimo (TODO-8).
 */
@UntilDestroy()
@Component({
  selector: 'app-panel-configuracion-rrhh',
  templateUrl: './panel-configuracion-rrhh.component.html',
  styleUrls: ['./panel-configuracion-rrhh.component.scss']
})
export class PanelConfiguracionRrhhComponent implements OnInit {

  secciones: SeccionVM[] = [];
  cargando = true;

  readonly meses = [
    { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' }, { v: 4, n: 'Abril' },
    { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' }, { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' },
    { v: 9, n: 'Septiembre' }, { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' }
  ];

  constructor(
    private configuracionRrhhService: ConfiguracionRrhhService,
    public mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cargar();
  }

  private cargar() {
    this.cargando = true;
    this.configuracionRrhhService.onGetAll().pipe(untilDestroyed(this)).subscribe((res: ConfiguracionRrhh[]) => {
      const porClave = new Map<string, ConfiguracionRrhh>();
      (res || []).forEach(c => porClave.set(c.clave, c));
      const usadas = new Set<string>();

      const secciones: SeccionVM[] = CONFIGURACION_RRHH_SECCIONES.map(sec => ({
        titulo: sec.titulo,
        icono: sec.icono,
        campos: sec.claves
          .map(clave => this.armarCampo(clave, porClave.get(clave)))
          .filter(Boolean) as CampoVM[]
      }));
      secciones.forEach(s => s.campos.forEach(c => usadas.add(c.clave)));

      // Claves activas no mapeadas en el catálogo (ej. una nueva por migración): "Otros".
      const otros = (res || []).filter(c => c.activo !== false && !usadas.has(c.clave))
        .map(c => this.armarCampo(c.clave, c)).filter(Boolean) as CampoVM[];
      if (otros.length > 0) {
        secciones.push({ titulo: 'Otros', icono: 'more_horiz', campos: otros });
      }

      this.secciones = secciones.filter(s => s.campos.length > 0);
      this.cargando = false;
    });
  }

  private armarCampo(clave: string, config: ConfiguracionRrhh): CampoVM {
    if (config == null) { return null; }
    const help = CONFIGURACION_RRHH_HELP[clave];
    const meta: ConfigCampoMeta = CONFIGURACION_RRHH_CAMPO_META[clave] || { widget: 'number' };
    const control = new FormControl(this.parseValor(config.valor, meta));
    return {
      clave,
      label: help?.titulo || this.humanizar(clave),
      ayuda: help?.descripcion || config.descripcion || '',
      meta,
      control,
      config,
      guardando: false
    };
  }

  private parseValor(valor: string, meta: ConfigCampoMeta): any {
    if (meta.widget === 'toggle') { return valor === 'true'; }
    const n = Number(valor);
    return isNaN(n) ? valor : n;
  }

  private humanizar(clave: string): string {
    const t = (clave || '').replace(/_/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  onGuardar(campo: CampoVM) {
    const valorAnterior = campo.config.valor;
    const valor = campo.meta.widget === 'toggle'
      ? (campo.control.value ? 'true' : 'false')
      : String(campo.control.value ?? '');
    if (valor === valorAnterior) { return; }

    campo.guardando = true;
    const input = {
      id: campo.config.id,
      clave: campo.config.clave,
      valor,
      tipo: campo.config.tipo,
      descripcion: campo.config.descripcion,
      activo: campo.config.activo,
      usuarioId: this.mainService.usuarioActual?.id
    };
    this.configuracionRrhhService.onSave(input).pipe(untilDestroyed(this)).subscribe((res: ConfiguracionRrhh) => {
      campo.guardando = false;
      if (res == null) { return; }
      campo.config.valor = valor;
      this.notificacion.openSucess('Configuración guardada');
      this.revisarImpacto(campo.clave, valor, valorAnterior);
    });
  }

  /** TODO-8: solo el salario mínimo requiere cascada guiada (ofrecida, nunca impuesta). */
  private revisarImpacto(clave: string, valor: string, valorAnterior: string) {
    if (clave !== 'SALARIO_MINIMO_LEGAL_PYG') { return; }
    const nuevo = Number(valor);
    const anterior = Number(valorAnterior);
    if (isNaN(nuevo)) { return; }
    if (!isNaN(anterior) && nuevo <= anterior) { return; }
    this.dialog.open(AjusteSalarioMinimoDialogComponent, {
      data: { minimo: nuevo }, width: '760px', disableClose: true
    });
  }

  onInfo(campo: CampoVM) {
    this.dialog.open(ConfigInfoDialogComponent, {
      data: { clave: campo.config.clave, valor: campo.config.valor, descripcion: campo.config.descripcion },
      width: '560px'
    });
  }
}

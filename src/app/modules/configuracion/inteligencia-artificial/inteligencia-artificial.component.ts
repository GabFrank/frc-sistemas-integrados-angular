import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../notificacion-snackbar.service';
import { ConfiguracionIa, ProveedorIa } from './configuracion-ia.model';
import { InteligenciaArtificialService } from './inteligencia-artificial.service';

const MODELO_OPENAI_POR_DEFECTO = 'gpt-4o';
const MODELO_CLAUDE_POR_DEFECTO = 'claude-opus-5-5';

const NOMBRES: Record<ProveedorIa, string> = { OPENAI: 'OpenAI', CLAUDE: 'Claude' };

interface ResultadoPrueba {
  texto: string;
  ok: boolean;
}

@Component({
  selector: 'app-inteligencia-artificial',
  templateUrl: './inteligencia-artificial.component.html',
  styleUrls: ['./inteligencia-artificial.component.scss'],
})
export class InteligenciaArtificialComponent implements OnInit {
  configuracion: ConfiguracionIa | null = null;
  cifradoDisponible = true;
  /** Nombre del proveedor guardado (el que lee las facturas ahora). */
  proveedorActivoNombre = NOMBRES.OPENAI;
  pruebas: Record<ProveedorIa, ResultadoPrueba | null> = { OPENAI: null, CLAUDE: null };
  ocupado = false;

  readonly modeloOpenAiPorDefecto = MODELO_OPENAI_POR_DEFECTO;
  readonly modeloClaudePorDefecto = MODELO_CLAUDE_POR_DEFECTO;

  form = new FormGroup({
    proveedor: new FormControl<ProveedorIa>('OPENAI'),
    apiKey: new FormControl<string>(''),
    modelo: new FormControl<string>(MODELO_OPENAI_POR_DEFECTO),
    claudeApiKey: new FormControl<string>(''),
    claudeModelo: new FormControl<string>(MODELO_CLAUDE_POR_DEFECTO),
    promptAdicional: new FormControl<string>(''),
  });

  constructor(
    private service: InteligenciaArtificialService,
    private dialogos: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.obtener().subscribe({
      next: (c) => c && this.aplicar(c),
    });
  }

  guardar(): void {
    const apiKey = (this.form.value.apiKey ?? '').trim();
    const claudeApiKey = (this.form.value.claudeApiKey ?? '').trim();
    this.enviar(apiKey === '' ? null : apiKey, claudeApiKey === '' ? null : claudeApiKey, 'Configuración guardada.');
  }

  borrarClave(proveedor: ProveedorIa): void {
    const nombre = NOMBRES[proveedor];
    const esActivo = this.configuracion?.proveedor === proveedor;
    this.dialogos
      .confirmar({
        titulo: 'Borrar clave',
        mensaje: `¿Borrar la clave de ${nombre} guardada?`,
        detalle: esActivo
          ? 'Es el proveedor activo: la lectura de facturas en papel dejará de funcionar hasta cargar una clave nueva.'
          : 'No afecta la lectura de facturas mientras el proveedor activo sea otro.',
        si: 'Borrar',
        no: 'Cancelar',
        peligro: true,
      })
      .subscribe((ok) => {
        if (ok === true) {
          this.enviar(proveedor === 'OPENAI' ? '' : null, proveedor === 'CLAUDE' ? '' : null, 'Clave borrada.');
        }
      });
  }

  probarConexion(proveedor: ProveedorIa): void {
    this.ocupado = true;
    this.pruebas = { ...this.pruebas, [proveedor]: null };
    this.service.probarConexion(proveedor).subscribe({
      next: (texto) => {
        this.ocupado = false;
        if (texto != null) {
          this.pruebas = { ...this.pruebas, [proveedor]: { texto, ok: texto.startsWith('Conexión OK') } };
        }
      },
      error: () => (this.ocupado = false),
      complete: () => (this.ocupado = false),
    });
  }

  private enviar(apiKey: string | null, claudeApiKey: string | null, mensajeOk: string): void {
    const v = this.form.value;
    this.ocupado = true;
    this.service
      .guardar({
        proveedor: v.proveedor ?? 'OPENAI',
        apiKey,
        modelo: (v.modelo ?? '').trim() || MODELO_OPENAI_POR_DEFECTO,
        claudeApiKey,
        claudeModelo: (v.claudeModelo ?? '').trim() || MODELO_CLAUDE_POR_DEFECTO,
        promptAdicional: v.promptAdicional ?? '',
      })
      .subscribe({
        next: (c) => {
          this.ocupado = false;
          if (c) {
            this.aplicar(c);
            this.notificacion.notification$.next({
              texto: mensajeOk,
              color: NotificacionColor.success,
              duracion: 3,
            });
          }
        },
        error: () => (this.ocupado = false),
        complete: () => (this.ocupado = false),
      });
  }

  private aplicar(c: ConfiguracionIa): void {
    this.configuracion = c;
    this.cifradoDisponible = c.cifradoDisponible !== false;
    const proveedor: ProveedorIa = c.proveedor === 'CLAUDE' ? 'CLAUDE' : 'OPENAI';
    this.proveedorActivoNombre = NOMBRES[proveedor];
    this.form.patchValue({
      proveedor,
      apiKey: '',
      modelo: c.modelo || MODELO_OPENAI_POR_DEFECTO,
      claudeApiKey: '',
      claudeModelo: c.claudeModelo || MODELO_CLAUDE_POR_DEFECTO,
      promptAdicional: c.promptAdicional ?? '',
    });
    if (this.cifradoDisponible) {
      this.form.controls.apiKey.enable();
      this.form.controls.claudeApiKey.enable();
    } else {
      this.form.controls.apiKey.disable();
      this.form.controls.claudeApiKey.disable();
    }
  }
}

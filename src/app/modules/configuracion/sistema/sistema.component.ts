import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { ConfiguracionSistemaGQL } from './graphql/configuracionSistemaQuery';
import { SetConfiguracionSistemaGQL } from './graphql/setConfiguracionSistema';
import { TestOpenAiConnectionGQL } from './graphql/testOpenAiConnection';
import { CONFIG_CLAVES, ConfiguracionSistema, MASCARA_SECRETO } from './sistema.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-configuracion-sistema',
  templateUrl: './sistema.component.html',
  styleUrls: ['./sistema.component.scss'],
})
export class SistemaComponent implements OnInit {
  iaForm: FormGroup;
  empresaForm: FormGroup;
  cargando = false;
  testeando = false;
  apiKeyEnmascarada = false;
  logoPreview: string | null = null;

  @ViewChild('logoInput') logoInput: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private notif: NotificacionSnackbarService,
    private getGQL: ConfiguracionSistemaGQL,
    private setGQL: SetConfiguracionSistemaGQL,
    private testGQL: TestOpenAiConnectionGQL,
  ) {
    this.iaForm = this.fb.group({
      apiKey: [''],
      modelo: ['gpt-4o'],
      promptAdicional: [''],
    });
    this.empresaForm = this.fb.group({
      nombre: [''],
      subtitulo: [''],
      direccion: [''],
      telefono: [''],
      logo: [''],
    });
  }

  ngOnInit(): void {
    this.cargarConfiguraciones();
  }

  async cargarConfiguraciones(): Promise<void> {
    this.cargando = true;
    try {
      const apiKey = await this.fetchValor(CONFIG_CLAVES.OPENAI_API_KEY);
      const modelo = await this.fetchValor(CONFIG_CLAVES.OPENAI_MODELO);
      const promptAdicional = await this.fetchValor(CONFIG_CLAVES.OPENAI_PROMPT_ADICIONAL);
      this.apiKeyEnmascarada = apiKey === MASCARA_SECRETO;
      this.iaForm.patchValue({
        apiKey: apiKey ?? '',
        modelo: modelo ?? 'gpt-4o',
        promptAdicional: promptAdicional ?? '',
      });

      const nombre = await this.fetchValor(CONFIG_CLAVES.EMPRESA_NOMBRE_IMPRESION);
      const subtitulo = await this.fetchValor(CONFIG_CLAVES.EMPRESA_SUBTITULO_IMPRESION);
      const direccion = await this.fetchValor(CONFIG_CLAVES.EMPRESA_DIRECCION_IMPRESION);
      const telefono = await this.fetchValor(CONFIG_CLAVES.EMPRESA_TELEFONO_IMPRESION);
      const logo = await this.fetchValor(CONFIG_CLAVES.EMPRESA_LOGO_BASE64);
      this.empresaForm.patchValue({
        nombre: nombre ?? '',
        subtitulo: subtitulo ?? '',
        direccion: direccion ?? '',
        telefono: telefono ?? '',
        logo: logo ?? '',
      });
      this.logoPreview = logo ? `data:image/*;base64,${logo}` : null;
    } catch (e) {
      this.notif.openWarn('Error al cargar configuraciones');
    } finally {
      this.cargando = false;
    }
  }

  private async fetchValor(clave: string): Promise<string | null> {
    const r = await firstValueFrom(this.getGQL.fetch({ clave }, { fetchPolicy: 'network-only' }));
    const config = (r.data as any)?.configuracionSistema as ConfiguracionSistema | null;
    return config?.valor ?? null;
  }

  async guardarIa(): Promise<void> {
    this.cargando = true;
    try {
      const v = this.iaForm.value;
      if (v.apiKey && v.apiKey !== MASCARA_SECRETO) {
        await this.setValor(CONFIG_CLAVES.OPENAI_API_KEY, v.apiKey);
        this.apiKeyEnmascarada = true;
        this.iaForm.patchValue({ apiKey: MASCARA_SECRETO }, { emitEvent: false });
      }
      await this.setValor(CONFIG_CLAVES.OPENAI_MODELO, v.modelo);
      await this.setValor(CONFIG_CLAVES.OPENAI_PROMPT_ADICIONAL, v.promptAdicional);
      this.notif.openSucess('Configuración de IA guardada');
    } catch (e) {
      this.notif.openWarn('Error al guardar IA: ' + (e as Error).message);
    } finally {
      this.cargando = false;
    }
  }

  async guardarEmpresa(): Promise<void> {
    this.cargando = true;
    try {
      const v = this.empresaForm.value;
      await this.setValor(CONFIG_CLAVES.EMPRESA_NOMBRE_IMPRESION, v.nombre);
      await this.setValor(CONFIG_CLAVES.EMPRESA_SUBTITULO_IMPRESION, v.subtitulo);
      await this.setValor(CONFIG_CLAVES.EMPRESA_DIRECCION_IMPRESION, v.direccion);
      await this.setValor(CONFIG_CLAVES.EMPRESA_TELEFONO_IMPRESION, v.telefono);
      await this.setValor(CONFIG_CLAVES.EMPRESA_LOGO_BASE64, v.logo);
      this.notif.openSucess('Datos de empresa guardados');
    } catch (e) {
      this.notif.openWarn('Error al guardar empresa: ' + (e as Error).message);
    } finally {
      this.cargando = false;
    }
  }

  private async setValor(clave: string, valor: string | null): Promise<void> {
    await firstValueFrom(this.setGQL.mutate({ clave, valor: valor || null }));
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      this.notif.openWarn('Logo demasiado grande. Máximo 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      this.empresaForm.patchValue({ logo: base64 });
      this.logoPreview = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  borrarLogo(): void {
    this.empresaForm.patchValue({ logo: '' });
    this.logoPreview = null;
    if (this.logoInput) this.logoInput.nativeElement.value = '';
  }

  async testearConexionIa(): Promise<void> {
    this.testeando = true;
    try {
      const r = await firstValueFrom(this.testGQL.mutate({}));
      const msg = (r.data as any)?.testOpenAiConnection || 'sin respuesta';
      if (msg === 'OK') {
        this.notif.openSucess('Conexión OpenAI exitosa');
      } else {
        this.notif.openWarn(msg);
      }
    } catch (e) {
      this.notif.openWarn('Error al probar conexión: ' + (e as Error).message);
    } finally {
      this.testeando = false;
    }
  }

  permitirEditarApiKey(): void {
    this.apiKeyEnmascarada = false;
    this.iaForm.patchValue({ apiKey: '' });
  }
}

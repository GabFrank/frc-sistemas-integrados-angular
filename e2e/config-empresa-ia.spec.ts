import { BrowserContext, ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
const PATH = require('path');

/**
 * E2E para Hito 1 — configuración de Sistema (tab IA + tab Empresa).
 *
 * Requisitos para correr (no auto-skip-eados — fallarán si el ambiente no está):
 *   1. Backend central corriendo en localhost:8081 con migración V127 aplicada.
 *   2. Usuario con rol ADMIN existente y credenciales conocidas en E2E_USER / E2E_PASS env vars.
 *   3. Variable APP_ENCRYPTION_KEY configurada en el backend (cualquier string, ej. "test-key").
 *
 * Estos tests están marcados con `test.skip` por defecto para no bloquear CI.
 * Para correr localmente: cambiar `test.skip` → `test` o usar `--grep config-sistema`.
 */

test.describe.skip('Configuración Sistema — IA + Empresa', () => {
  let app: ElectronApplication;
  let win: Page;
  let context: BrowserContext;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: [
        PATH.join(__dirname, '../app/main.js'),
        PATH.join(__dirname, '../app/package.json'),
      ],
    });
    context = app.context();
    await context.tracing.start({ screenshots: true, snapshots: true });
    win = await app.firstWindow();
    await win.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await context.tracing.stop({ path: 'e2e/tracing/config-empresa-ia.zip' });
    await app.close();
  });

  test('navegar a Configuración → Sistema, ver tabs IA y Empresa', async () => {
    // Asume usuario logueado con rol ADMIN
    await win.click('text=Configuración');
    await win.click('text=Sistema (IA + Empresa)');
    await expect(win.locator('h2:has-text("CONFIGURACIÓN DEL SISTEMA")')).toBeVisible();
    await expect(win.locator('mat-tab-group .mat-tab-label:has-text("EMPRESA")')).toBeVisible();
    await expect(win.locator('mat-tab-group .mat-tab-label:has-text("INTELIGENCIA ARTIFICIAL")')).toBeVisible();
  });

  test('guardar datos de empresa persiste tras reload', async () => {
    await win.click('mat-tab-label:has-text("EMPRESA")');
    await win.fill('input[formcontrolname="nombre"]', 'FARMACIA E2E TEST');
    await win.fill('input[formcontrolname="direccion"]', 'Av. Test 123');
    await win.fill('input[formcontrolname="telefono"]', '021-555-9999');
    await win.click('button:has-text("GUARDAR DATOS EMPRESA")');
    await expect(win.locator('text=Datos de empresa guardados')).toBeVisible();

    // Reload — re-abrir el tab debe traer los valores
    await win.reload();
    await win.click('text=Configuración');
    await win.click('text=Sistema (IA + Empresa)');
    await expect(win.locator('input[formcontrolname="nombre"]')).toHaveValue('FARMACIA E2E TEST');
    await expect(win.locator('input[formcontrolname="direccion"]')).toHaveValue('Av. Test 123');
  });

  test('guardar API key OpenAI queda enmascarada en próxima carga', async () => {
    await win.click('mat-tab-label:has-text("INTELIGENCIA ARTIFICIAL")');
    await win.fill('input[formcontrolname="apiKey"]', 'sk-test-fake-key-for-e2e-only');
    await win.click('button:has-text("GUARDAR IA")');
    await expect(win.locator('text=Configuración de IA guardada')).toBeVisible();

    // El campo apiKey debe quedar como "***" (enmascarado) post-save
    await expect(win.locator('input[formcontrolname="apiKey"]')).toHaveValue('***');

    // Reload — sigue enmascarado
    await win.reload();
    await win.click('text=Configuración');
    await win.click('text=Sistema (IA + Empresa)');
    await win.click('mat-tab-label:has-text("INTELIGENCIA ARTIFICIAL")');
    await expect(win.locator('input[formcontrolname="apiKey"]')).toHaveValue('***');
  });

  test('probar conexión con key inválida muestra error legible', async () => {
    await win.click('mat-tab-label:has-text("INTELIGENCIA ARTIFICIAL")');
    await win.click('button:has-text("PROBAR CONEXIÓN")');
    // Con key 'sk-test-fake-...' la API real responderá 401, esperamos mensaje de error
    await expect(win.locator('text=/ERROR.*HTTP/')).toBeVisible({ timeout: 20000 });
  });

  test('subir logo base64 muestra preview', async () => {
    await win.click('mat-tab-label:has-text("EMPRESA")');
    // 1x1 PNG transparente base64
    const tinyPngPath = PATH.join(__dirname, 'fixtures', 'logo-test.png');
    await win.setInputFiles('input[type="file"][accept="image/*"]', tinyPngPath);
    await expect(win.locator('.logo-preview img')).toBeVisible();
    await win.click('button:has-text("GUARDAR DATOS EMPRESA")');
    await expect(win.locator('text=Datos de empresa guardados')).toBeVisible();
  });
});

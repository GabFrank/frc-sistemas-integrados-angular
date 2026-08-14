import { BrowserContext, ElectronApplication, Page, _electron as electron } from 'playwright';
import { test, expect } from '@playwright/test';
const PATH = require('path');

/**
 * E2E de humo del flujo de Liquidacion de Sueldo (modulo RRHH).
 *
 * REQUISITOS para correrlo (ambiente dev real, no CI restringido):
 *   - Backend `frc-comercial/central` corriendo y accesible por GraphQL.
 *   - Base con datos semilla: al menos un funcionario con usuario, sueldo y
 *     una Caja Mayor (CajaVirtual tipo CAJA_MAYOR) activa.
 *   - Credenciales de un usuario con rol RRHH VER / RRHH LIQUIDAR en las
 *     variables de entorno RRHH_E2E_USER / RRHH_E2E_PASS.
 *
 * Por eso el bloque esta guardado con RRHH_E2E=1: en CI (sin app empaquetada
 * ni backend) no corre y no rompe el pipeline. Para ejecutarlo en dev:
 *   RRHH_E2E=1 RRHH_E2E_USER=... RRHH_E2E_PASS=... npm run e2e
 *
 * Es un esqueleto: ajustar los selectores a los data-test / textos reales de
 * la pantalla de login y del sidenav una vez validado manualmente el flujo.
 */
const RUN = process.env.RRHH_E2E === '1';

test.describe(RUN ? 'RRHH · Liquidacion de sueldo' : 'RRHH · Liquidacion de sueldo (skip: set RRHH_E2E=1)', () => {
  let app: ElectronApplication;
  let win: Page;
  let context: BrowserContext;

  test.beforeAll(async () => {
    test.skip(!RUN, 'Requiere backend dev + datos semilla; correr con RRHH_E2E=1');
    app = await electron.launch({
      args: [PATH.join(__dirname, '../app/main.js'), PATH.join(__dirname, '../app/package.json')],
    });
    context = app.context();
    await context.tracing.start({ screenshots: true, snapshots: true });
    win = await app.firstWindow();
    await win.waitForLoadState('domcontentloaded');
  });

  test('login con usuario RRHH', async () => {
    const user = process.env.RRHH_E2E_USER || '';
    const pass = process.env.RRHH_E2E_PASS || '';
    // TODO: ajustar selectores reales del login
    await win.fill('input[formcontrolname="nickname"]', user);
    await win.fill('input[formcontrolname="password"]', pass);
    await win.click('button[type="submit"]');
    await win.waitForTimeout(2000);
    // el header aparece una vez logueado
    await expect(win.locator('app-header')).toBeVisible();
  });

  test('abrir modulo Liquidaciones desde el sidenav', async () => {
    // abrir grupo R.R.H.H. y navegar a Liquidaciones
    await win.getByText('R.R.H.H.', { exact: false }).first().click();
    await win.getByText('Liquidaciones', { exact: true }).click();
    // el tab de la lista debe montarse
    await expect(win.locator('app-list-liquidacion')).toBeVisible();
  });

  test('generar borrador y verlo en la lista', async () => {
    // buscar por periodo (mes actual precargado) y generar mes
    await win.getByRole('button', { name: /Generar mes/i }).click();
    await win.waitForTimeout(1500);
    const filas = win.locator('app-list-liquidacion table tbody tr');
    expect(await filas.count()).toBeGreaterThan(0);
  });

  test('abrir detalle: haberes, descuentos y neto coherentes', async () => {
    await win.locator('app-list-liquidacion table tbody tr').first().click();
    const dialog = win.locator('app-liquidacion-detalle-dialog');
    await expect(dialog).toBeVisible();
    // el neto debe ser haberes - descuentos (validacion visual del motor)
    await expect(dialog.getByText(/Neto/i)).toBeVisible();
  });

  test.afterAll(async () => {
    if (!RUN) return;
    await context.tracing.stop({ path: 'e2e/tracing/trace-rrhh.zip' });
    await app.close();
  });
});

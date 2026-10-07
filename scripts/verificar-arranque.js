/**
 * Arranque de humo: abre el build de producción (`dist/`) en Electron y falla si la app no llega a
 * dibujar nada.
 *
 * Por qué existe: `npm run build:prod` compila el bundle pero nadie lo ejecuta. Un error que solo
 * aparece al evaluar el bundle concatenado (una constante leída antes de inicializarse dentro de un
 * ciclo de imports) deja la ventana en blanco con el build en verde: los alphas .125 a .164 de
 * 2026-10 se publicaron así.
 *
 * Uso: `npm run build:prod && npm run verificar:arranque` (en un servidor sin pantalla, con `xvfb-run -a`).
 * No necesita backend: con un perfil nuevo la app muestra la configuración inicial.
 *
 * Códigos de salida: 0 arrancó; 1 el bundle no arranca; 2 no se pudo hacer la prueba (falta `dist/`,
 * Electron no levantó).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { _electron } = require('playwright');

const RAIZ = path.join(__dirname, '..');
/** Cuánto se espera a que `app-root` tenga contenido. En local tarda ~2 s. */
const ESPERA_RENDER_MS = 30000;
/** Un error de este tipo falla la verificación aunque la app haya dibujado algo. */
const ERROR_DE_ORDEN = /before initialization/i;

async function main() {
  if (!fs.existsSync(path.join(RAIZ, 'dist', 'index.html'))) {
    console.error('No existe dist/index.html: corré antes `npm run build:prod`.');
    return 2;
  }

  // Perfil y home propios: la app también busca config guardada en el home y en appData, y con la de
  // un desarrollador se conectaría a sus servidores. Además evita el bloqueo de instancia única.
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'frc-arranque-'));
  const entorno = {
    ...process.env,
    HOME: perfil,
    XDG_CONFIG_HOME: path.join(perfil, '.config'),
    // Con otro HOME, X11 ya no encuentra la credencial de la pantalla por su ruta por defecto.
    XAUTHORITY: process.env.XAUTHORITY || path.join(os.homedir(), '.Xauthority'),
  };

  let app;
  let proceso;
  let salida = '';
  const errores = [];
  const anotar = (texto) => {
    if (texto && !errores.includes(texto)) errores.push(texto);
  };
  let dibujo = false;

  try {
    app = await _electron.launch({
      cwd: RAIZ,
      args: ['.', `--user-data-dir=${path.join(perfil, 'perfil')}`, '--no-sandbox', '--enable-logging=stderr'],
      env: entorno,
      timeout: 60000,
    });
    // El error de arranque ocurre mientras carga la página, antes de que haya dónde suscribirse:
    // por eso también se lee de la salida de Electron (se junta entera: una línea puede llegar partida).
    // Se guarda ahora: después de `close()` Playwright ya no deja pedir el proceso.
    proceso = app.process();
    proceso.stderr.on('data', (dato) => (salida += String(dato)));

    // Que no aparezca la ventana también es «no dibujó», no un fallo de la prueba.
    const ventana = await app.firstWindow().catch(() => null);
    if (ventana) {
      ventana.on('pageerror', (e) => anotar(`Uncaught ${e.name || 'Error'}: ${e.message}`));
      dibujo = await ventana
        .waitForFunction(() => (document.querySelector('app-root')?.childElementCount ?? 0) > 0, null, {
          timeout: ESPERA_RENDER_MS,
          // Por intervalo y no por cuadro: sin gestor de ventanas la página puede no pintar cuadros.
          polling: 250,
        })
        .then(() => true)
        .catch(() => false);
      // Margen para que un error de un módulo que carga después del primer dibujo llegue a anotarse.
      await ventana.waitForTimeout(3000).catch(() => {});
    }
  } finally {
    if (app) {
      // La app no cierra con SIGTERM: se le da un momento y se termina el grupo entero (Playwright la
      // lanza como líder de grupo), para que no quede un hijo escribiendo en el perfil al borrarlo.
      await Promise.race([app.close().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]);
    }
    if (proceso) {
      try {
        process.kill(-proceso.pid, 'SIGKILL');
      } catch {
        try {
          proceso.kill('SIGKILL');
        } catch {}
      }
    }
    try {
      fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch {}
  }

  for (const m of salida.matchAll(/"(Uncaught [^"]+)"/g)) anotar(m[1]);

  const deOrden = errores.filter((e) => ERROR_DE_ORDEN.test(e));
  if (dibujo && deOrden.length === 0) {
    console.log('Arranque OK: la app dibujó su primera pantalla.');
    if (errores.length) console.log(`Errores de consola que no bloquean:\n  ${errores.join('\n  ')}`);
    return 0;
  }

  console.error(
    dibujo
      ? 'El bundle de producción arrancó con un error de orden de carga:'
      : `El bundle de producción no dibujó nada en ${ESPERA_RENDER_MS / 1000} s (ventana en blanco).`
  );
  console.error(errores.length ? `  ${errores.join('\n  ')}` : '  (sin errores de consola capturados)');
  if (deOrden.length) {
    console.error(
      '\n«before initialization» = un archivo lee, al cargarse, un valor de otro que está en un ciclo de imports\n' +
        'y todavía no se evaluó. Ver CLAUDE.md §GraphQL / Apollo y `npm run verificar:imports`.'
    );
  }
  return 1;
}

main().then(
  (codigo) => process.exit(codigo),
  (e) => {
    console.error('No se pudo levantar Electron para la verificación (no es un veredicto sobre el bundle):', e);
    process.exit(2);
  }
);

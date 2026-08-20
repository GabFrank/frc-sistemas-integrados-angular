import { ipAddress, port, ipCentralAddress, centralPort } from "./conectionConfig";

/**
 * Build web de producción — la que publica Cloudflare Pages en
 * `<empresa>.desk.frcsuite.com`.
 *
 * Los valores de servidor de acá son SOLO el fallback para un hostname que no
 * esté en el mapa de `commons/core/utils/webEndpoints.ts` (una preview de Pages,
 * `localhost`). En las puertas conocidas el central lo define el hostname, no
 * este archivo. Que el fallback no sea producción es deliberado.
 */
export const APP_CONFIG = {
  production: true,
  environment: 'WEB'
};

export const environment = {
  production: true,
  version: '0.0.0',
  usuario: 1,
  sucursalId: 1,
  firebaseConfig: {
    apiKey: "AIzaSyDXo7_lxOte36xJzucflKYPXKTxeYosEKI",
    authDomain: "bodega-franco-frc.firebaseapp.com",
    projectId: "bodega-franco-frc",
    storageBucket: "bodega-franco-frc.firebasestorage.app",
    messagingSenderId: "170136643206",
    appId: "1:170136643206:web:f041a6acbfa412dea5d307",
    measurementId: "G-3SKWPWH95N",
    vapidKey: "BD2NBAWDMVmY7hiM9HJB-F9E1oMCBcBS9-JeJ1CxNDkDdrlp8jWzHngYHPnNqqmkFJPNU-5xPMpCpt3hGMPrSLM"
  },
  serverIp: ipAddress,
  serverPort: port,
  serverCentralIp: ipCentralAddress,
  serverCentralPort: centralPort
};

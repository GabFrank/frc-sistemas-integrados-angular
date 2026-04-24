import { ipAddress, port, ipCentralAddress, centralPort } from "./conectionConfig";

export const APP_CONFIG = {
  production: false,
  environment: 'LOCAL'
};

export const environment = {
  production: false,
  version: '1.0.4',
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

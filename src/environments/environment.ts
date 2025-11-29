import { ipCentralAddress, centralPort, ipAddress, port } from "./conectionConfig";

export const APP_CONFIG = {
  production: false,
  environment: 'LOCAL'
};

export const environment = {
  version: '1.0.5',
  production: false,
  usuario: 1,
  sucursalId: 1,
 firebaseConfig: {
  apiKey: "AIzaSyDAPq38fcPq-8qtSbQ_YyTc0Vc0pqlqWV4",
  authDomain: "bodega-franco-frc.firebaseapp.com",
  projectId: "bodega-franco-frc",
  storageBucket: "bodega-franco-frc.appspot.com",
  messagingSenderId: "170136643206",
  appId: "1:170136643206:web:b02e8a1da223c98da5d307"
},
  serverCentralIp: ipCentralAddress,
  serverCentralPort: centralPort,
  serverIp: ipAddress,
  serverPort: port,
  sucursales: null,
  printers: null,
  local: null,
  precios: null,
  modo: null,
  pdvId: null
};

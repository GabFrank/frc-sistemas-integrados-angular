import { ipAddress, port } from "./conectionConfig";

export const APP_CONFIG = {
  production: true,
  environment: 'PROD'
};

export const environment = {
  production: true,
  version: 'DEV',
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
  serverIp: ipAddress,
  serverPort: port
};


import { ipAddress, port } from "./conectionConfig";

export const APP_CONFIG = {
  production: false,
  environment: 'LOCAL'
};

export const environment = {
  production: false,
  usuario : 1,
  sucursalId: 1,
  firebaseConfig : {
    apiKey: "AIzaSyDAPq38fcPq-8qtSbQ_YyTc0Vc0pqlqWV4",
    authDomain: "franco-system.firebaseapp.com",
    projectId: "franco-system",
    storageBucket: "franco-system.appspot.com",
    messagingSenderId: "389460380308",
    appId: "1:389460380308:web:53701896405855d9f64281"
  },
  
};

export const serverAdress = {
  serverIp: localStorage.getItem('serverIpAddress') != null ? localStorage.getItem('serverIpAddress') : ipAddress,
  serverPort: port
}

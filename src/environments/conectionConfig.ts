// let config = require('electron-node-config');

// export const ipAddress = '150.136.137.98' //servidor central
export const port = 8082
export const ipAddress = 'localhost'

export const centralPort = 8081
export const ipCentralAddress = 'localhost'

export const version = '1.0.5'

// boton finalizar ni botonn menu de servidor no se bloquea
// boton 

export interface ConfigFile {
    serverUrl: string;
    serverPort: number
    repositoryUrl: string;
}
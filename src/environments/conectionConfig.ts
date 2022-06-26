// let config = require('electron-node-config');

export const ipAddress = '150.136.137.98' //servidor central
export const port = 8081
// export const ipAddress = '172.25.0.3' // katuete 2
// export const ipAddress = '172.25.0.21' // puente kyjha
// export const ipAddress = '172.25.0.1'
// export const ipAddress = '172.25.0.4'
// export const ipAddress = 'localhost'

export const version = '1.0.5'

// boton finalizar ni botonn menu de servidor no se bloquea
// boton 

export interface ConfigFile {
    serverUrl: string;
    serverPort: number
    repositoryUrl: string;
}
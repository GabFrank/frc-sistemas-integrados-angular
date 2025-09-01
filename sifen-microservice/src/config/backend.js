module.exports = {
  // URL del backend Java
  url: process.env.BACKEND_URL || 'http://localhost:8081',
  
  // Timeout para las consultas HTTP
  timeout: 10000,
  
  // Headers por defecto
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  
  // Endpoints disponibles
  endpoints: {
    factura: '/api/sifen/factura'
  },
  
  // Configuración de reintentos
  retries: 3,
  retryDelay: 1000
};

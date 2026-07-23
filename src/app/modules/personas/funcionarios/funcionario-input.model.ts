
export class FuncionarioInput {
  id: number;
  personaId: number;
  cargoId: number;
  sucursalId: number;
  credito: number;
  fechaIngreso: string;
  sueldo: number;
  fasePrueba: boolean
  diarista: boolean
  supervisadoPorId: number
  creadoEn: Date;
  usuarioId: number = null;
  horarioId: number;
  activo: boolean;
  // Campos agregados para InformacionGeneralComponent (legajo, tab "Información general").
  codigoInterno: string;
  ipsActivo: boolean;
  numeroIps: string;
  fechaIngresoIps: string;
  cuentaBancaria: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
}

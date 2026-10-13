import { Cliente } from "../../../../personas/clientes/cliente.model";

/**
 * ¿El filial va a tomar a este cliente como receptor con nombre en la factura electrónica? Es el
 * espejo de `SifenReceptorHelper` del filial: sin cliente, sin persona, nombre vacío o «Sin Nombre»,
 * documento vacío o «0» es una factura sin nombre, que SIFEN no admite desde 7.000.000 (#473).
 */
export function esClienteNominado(cliente: Cliente): boolean {
  if (cliente?.id == null) return false;
  const nombre = (cliente.persona?.nombre ?? "").trim();
  const documento = (cliente.persona?.documento ?? "").trim();
  if (nombre === "" || nombre.toUpperCase() === "SIN NOMBRE") return false;
  if (documento === "" || documento === "0") return false;
  return true;
}

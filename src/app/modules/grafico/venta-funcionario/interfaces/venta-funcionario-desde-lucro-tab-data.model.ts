import { VentaFuncionarioItem } from "./venta-funcionario-item.model";

export interface VentaFuncionarioDesdeLucroTabData {
  source: "lucro-por-funcionario";
  datos: VentaFuncionarioItem[];
  titulo?: string;
  subtitulo?: string;
  mostrarTodos?: boolean;
}

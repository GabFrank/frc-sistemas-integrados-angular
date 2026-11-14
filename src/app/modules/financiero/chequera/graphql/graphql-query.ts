import gql from 'graphql-tag';

// Campos completos de una chequera (para gestión y selects del dashboard de cheques).
const chequeraFields = `
  id
  nombre
  firmantes
  rangoDesde
  rangoHasta
  siguienteNumero
  estado
  hojasDisponibles
  fechaRetiro
  creadoEn
  cuentaBancaria {
    id
    numero
    banco { id nombre }
    moneda { id simbolo denominacion }
  }
  usuario { id }
`;

export const chequeraQuery = gql`
  query chequeraQuery($id: ID!) {
    data: chequera(id: $id) {
      ${chequeraFields}
    }
  }
`;

export const chequerasQuery = gql`
  query chequerasQuery($page: Int, $size: Int) {
    data: chequeras(page: $page, size: $size) {
      ${chequeraFields}
    }
  }
`;

export const chequerasSearchQuery = gql`
  query chequerasSearchQuery($texto: String) {
    data: chequerasSearch(texto: $texto) {
      ${chequeraFields}
    }
  }
`;

export const countChequeraQuery = gql`
  query {
    data: countChequera
  }
`;

export const saveChequera = gql`
  mutation saveChequera($entity: ChequeraInput!) {
    data: saveChequera(entity: $entity) {
      id
      cuentaBancaria {
        id
      }
      rangoDesde
      rangoHasta
      siguienteNumero
      estado
      fechaRetiro
      creadoEn
      usuario {
        id
      }
      cheques {
        id
      }
    }
  }
`;

export const deleteChequera = gql`
  mutation deleteChequera($id: ID!) {
    data: deleteChequera(id: $id)
  }
`; 
// ── Números inutilizados (central #603) ──

const numeroInutilizadoFields = `
  id
  numero
  motivo
  creadoEn
  accionCheque
  numeroNuevo
  revertidoEn
  usuario { id persona { nombre } }
  revertidoPor { id persona { nombre } }
  cheque { id numero estado beneficiario total }
  chequera { id nombre }
`;

export const numerosInutilizadosQuery = gql`
  query numerosInutilizados($chequeraId: ID) {
    data: numerosInutilizados(chequeraId: $chequeraId) {
      ${numeroInutilizadoFields}
    }
  }
`;

export const proximosNumerosChequeQuery = gql`
  query proximosNumerosCheque($chequeraId: ID!, $cantidad: Int!) {
    data: proximosNumerosCheque(chequeraId: $chequeraId, cantidad: $cantidad)
  }
`;

export const inutilizarNumeroChequeMutation = gql`
  mutation inutilizarNumeroCheque($chequeraId: ID!, $numero: Float!, $motivo: String!,
                                  $accionCheque: AccionChequeInutilizado, $numeroNuevo: Float) {
    data: inutilizarNumeroCheque(chequeraId: $chequeraId, numero: $numero, motivo: $motivo,
                                 accionCheque: $accionCheque, numeroNuevo: $numeroNuevo) {
      ${numeroInutilizadoFields}
    }
  }
`;

export const revertirInutilizacionMutation = gql`
  mutation revertirInutilizacion($id: ID!) {
    data: revertirInutilizacion(id: $id) {
      ${numeroInutilizadoFields}
    }
  }
`;

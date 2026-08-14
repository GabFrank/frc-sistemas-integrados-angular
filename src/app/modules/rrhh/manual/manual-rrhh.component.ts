import { Component } from '@angular/core';

interface ManualSeccion {
  icon: string;
  titulo: string;
  paraQue: string;
  pasos: string[];
  tip?: string;
}

interface ManualCategoria {
  nombre: string;
  icon: string;
  secciones: ManualSeccion[];
}

@Component({
  selector: 'app-manual-rrhh',
  templateUrl: './manual-rrhh.component.html',
  styleUrls: ['./manual-rrhh.component.scss']
})
export class ManualRrhhComponent {

  categorias: ManualCategoria[] = [
    {
      nombre: 'Personal',
      icon: 'badge',
      secciones: [
        {
          icon: 'folder_shared',
          titulo: 'Legajo del funcionario',
          paraQue: 'Es la ficha completa de cada empleado, organizada como un mini-panel con pestañas: sus datos, su situación financiera, su cargo, su salario y sus documentos. Desde acá también se da de alta a un empleado nuevo y se hacen los cambios importantes de su carrera dentro de la empresa.',
          pasos: [
            'Entrá a R.R.H.H. → Personal → Funcionarios y elegí al empleado para abrir su legajo. Para uno nuevo, usá el botón de agregar.',
            'En la pestaña "Información general" cargás o editás sus datos (documento, nacimiento, contacto, datos laborales, IPS) y su foto de perfil. Acá se crea el empleado nuevo.',
            'En "Financiero" ves de un vistazo todo lo que debe o cobró (crédito, vales, préstamos, penalizaciones) y su exposición total. Es solo lectura.',
            'En "Cargos" y "Salarios" cambiás el cargo o el salario, y queda el historial de cada cambio (fecha, valor anterior y nuevo).',
            'En "Documentos" subís y ves archivos del legajo (contrato, cédula, carnet de salud, etc.).',
            'Con el acceso rápido de arriba también podés lanzar la Liquidación final o dar de baja al empleado.'
          ],
          tip: 'Cuando le cambiás el salario, el sistema te avisa si queda por debajo del mínimo legal y te pide confirmar. El cargo y el salario quedan versionados: nada se pierde, todo queda auditado.'
        },
        {
          icon: 'schedule',
          titulo: 'Historial de marcaciones',
          paraQue: 'Sirve para ver a qué hora entró y salió cada empleado, en un rango de fechas. Útil para revisar la asistencia.',
          pasos: [
            'Entrá a R.R.H.H. → Asistencia → Historial de marcaciones.',
            'Elegí el empleado y el rango de fechas que querés revisar.',
            'La lista te muestra las entradas y salidas.',
            'Si necesitás, podés imprimir el reporte.'
          ]
        }
      ]
    },
    {
      nombre: 'Asistencia',
      icon: 'event_available',
      secciones: [
        {
          icon: 'event',
          titulo: 'Feriados',
          paraQue: 'Es la lista de días feriados. El sistema la usa para saber cuándo una hora extra vale más (recargo de feriado).',
          pasos: [
            'Entrá a R.R.H.H. → Configuración → Feriados.',
            'Tocá el botón para agregar un feriado nuevo con su fecha y nombre.',
            'Podés editar o quitar los que ya cargaste.'
          ]
        },
        {
          icon: 'event_note',
          titulo: 'Justificativos',
          paraQue: 'Sirve para justificar situaciones de la jornada: un permiso, una ausencia justificada, una vacación. Según el tipo, el justificativo puede descontar (o no) del sueldo y puede evitar que el empleado reciba una penalización por ese día.',
          pasos: [
            'Entrá a R.R.H.H. → Asistencia → Justificativos.',
            'Agregá un justificativo para el empleado, elegí el tipo y la fecha.',
            'Guardá. A partir de ahí ese día queda justificado.'
          ],
          tip: 'Los tipos de justificativo se administran en R.R.H.H. → Configuración → Tipos de justificativo. Ahí se define si un tipo descuenta salario y si evita la penalización por tardanza.'
        },
        {
          icon: 'gavel',
          titulo: 'Penalizaciones',
          paraQue: 'Son los descuentos por llegar tarde. El sistema las genera solo cada día, revisando quién llegó tarde sin justificación.',
          pasos: [
            'Entrá a R.R.H.H. → Asistencia → Penalizaciones para ver las que se generaron.',
            'Si una penalización no corresponde, podés anularla.',
            'También podés justificar el día para que no se cobre.',
            'Podés imprimir un recibo de la penalización para que el empleado la firme (PDF o Ticket).'
          ],
          tip: 'El sistema respeta unos minutos de tolerancia (configurables). Solo penaliza cuando la tardanza pasa ese margen.'
        },
        {
          icon: 'more_time',
          titulo: 'Horas extra',
          paraQue: 'Sirve para registrar las horas de más que trabajó un empleado. El sistema calcula solo cuánto valen según el tipo (día, noche o feriado).',
          pasos: [
            'Entrá a R.R.H.H. → Asistencia → Horas extra.',
            'Cargá las horas del empleado, con la fecha y el tipo.',
            'Al guardar, el monto se calcula automáticamente.',
            'Esas horas se suman después al sueldo del mes.'
          ]
        }
      ]
    },
    {
      nombre: 'Dinero para el empleado',
      icon: 'payments',
      secciones: [
        {
          icon: 'label',
          titulo: 'Motivos de vale',
          paraQue: 'Es la lista de razones por las que se puede pedir un vale (por ejemplo: adelanto, emergencia). Ayuda a ordenar y clasificar los vales.',
          pasos: [
            'Entrá a R.R.H.H. → Configuración → Motivos de vale.',
            'Agregá o editá los motivos que uses habitualmente.'
          ]
        },
        {
          icon: 'request_quote',
          titulo: 'Vales / adelantos',
          paraQue: 'Es un adelanto de plata al empleado. Cuando lo confirmás, sale la plata de la caja; después se le descuenta cuando se le paga el sueldo.',
          pasos: [
            'Entrá a R.R.H.H. → Anticipos → Vales.',
            'Creá un vale para el empleado, con el monto y el motivo. Queda como "solicitado".',
            'Cuando lo confirmás, el sistema saca la plata de la Caja Mayor.',
            'Ese vale se descuenta solo en la próxima liquidación de sueldo.',
            'Podés imprimir un recibo del vale para que el empleado lo firme (PDF o Ticket).'
          ],
          tip: 'El empleado también puede pedir un vale desde la app del celular; te llega como "solicitado" para que lo confirmes.'
        },
        {
          icon: 'account_balance_wallet',
          titulo: 'Préstamos',
          paraQue: 'Es un préstamo al empleado que se paga en varias cuotas. Podés cobrarlo directamente o descontarlo del sueldo.',
          pasos: [
            'Entrá a R.R.H.H. → Anticipos → Préstamos.',
            'Creá el préstamo indicando el monto total y en cuántas cuotas se paga.',
            'Al crearlo, sale el dinero de la Caja Mayor.',
            'Podés ver el plan de cuotas y cobrar una cuota cuando el empleado paga.',
            'Las cuotas también se pueden descontar automáticamente del sueldo.',
            'Podés imprimir un recibo de la entrega del préstamo para que el empleado lo firme (PDF o Ticket).'
          ]
        }
      ]
    },
    {
      nombre: 'Beneficios',
      icon: 'card_giftcard',
      secciones: [
        {
          icon: 'beach_access',
          titulo: 'Vacaciones',
          paraQue: 'Sirve para llevar el control de los días de vacaciones que le corresponden a cada empleado, los que ya se tomó y los que se le pagaron.',
          pasos: [
            'Entrá a R.R.H.H. → Beneficios → Vacaciones.',
            'El sistema calcula solo los días que le corresponden según su antigüedad.',
            'Con "Solicitar" programás un período; luego se aprueba.',
            'Cuando el empleado se toma las vacaciones, marcás el período como "gozado".',
            'Si en vez de tomarlas se le pagan, podés registrar la venta de esos días (se pagan en el sueldo o en el finiquito).'
          ],
          tip: 'Los días de vacaciones tienen fecha de vencimiento. El sistema te avisa cuando están por prescribir.'
        },
        {
          icon: 'redeem',
          titulo: 'Aguinaldo',
          paraQue: 'Es el pago del aguinaldo (13.º salario). El sistema lo calcula automáticamente según lo trabajado en el año. Podés pagarlo junto con el sueldo de fin de año o por separado.',
          pasos: [
            'Entrá a R.R.H.H. → Beneficios → Aguinaldos.',
            'El sistema calcula el aguinaldo del año para cada empleado.',
            'Revisás y aprobás el monto.',
            'Para pagarlo por separado: tocá "Pagar", elegí la Caja Mayor y confirmá. Después podés imprimir el recibo (PDF o Ticket).',
            'Si no lo pagás por separado, se suma solo al sueldo del mes de aguinaldo.'
          ],
          tip: 'Si ya pagaste el aguinaldo por separado, el sistema NO lo vuelve a sumar en la liquidación del sueldo. No hay riesgo de pagarlo dos veces.'
        },
        {
          icon: 'star',
          titulo: 'Bonos',
          paraQue: 'Sirve para darle un pago extra al empleado (por ejemplo, un premio o incentivo). Puede ser una sola vez o repetirse todos los meses.',
          pasos: [
            'Entrá a R.R.H.H. → Beneficios → Bonos.',
            'Creá el bono para el empleado con su monto.',
            'Indicá si es por única vez o recurrente.',
            'El bono se suma al sueldo del mes correspondiente.',
            'Podés imprimir un recibo del bono para que el empleado lo firme (PDF o Ticket).'
          ]
        }
      ]
    },
    {
      nombre: 'Pagos de sueldo',
      icon: 'receipt_long',
      secciones: [
        {
          icon: 'print',
          titulo: 'Imprimir recibos: PDF o Ticket',
          paraQue: 'Todos los comprobantes que el empleado firma (vale, penalización, aguinaldo, préstamo, bono, recibo de sueldo y finiquito) se pueden imprimir de dos maneras. Vos elegís cuál en el momento de imprimir.',
          pasos: [
            'Al tocar "Imprimir recibo" (o "Ver recibo"), el sistema te pregunta el formato.',
            'PDF (A4): se abre el comprobante en pantalla, listo para imprimir en una hoja normal o guardar.',
            'Ticket (58mm u 80mm): se imprime al toque en la impresora térmica (la del cajero/mostrador), como un ticket.',
            'Elegí el que te convenga según cómo lo vas a hacer firmar.'
          ],
          tip: 'Para usar la opción Ticket tenés que tener una impresora térmica configurada en Configuración → Impresoras. Los reportes (nómina, IPS, etc.) salen solo en PDF.'
        },
        {
          icon: 'receipt',
          titulo: 'Liquidación de sueldo',
          paraQue: 'Es el cálculo del sueldo del mes. El sistema junta todo (salario, horas extra, bonos, aguinaldo, y los descuentos por vales, cuotas y penalizaciones) y saca cuánto cobra el empleado.',
          pasos: [
            'Entrá a R.R.H.H. → Liquidaciones.',
            'Generá la liquidación del período, para un empleado o para todos a la vez.',
            'Revisá el detalle: vas a ver los conceptos que suman y los que restan, y el neto a pagar. Si hace falta, podés editar, agregar o quitar un ítem (queda auditado quién y cuándo).',
            'Aprobá la liquidación cuando esté correcta.',
            'Pagala eligiendo la Caja Mayor. Al pagar, se descuentan solos los vales y cuotas pendientes.',
            'Imprimí el recibo de sueldo para el empleado (PDF o Ticket).'
          ],
          tip: 'Si un dato quedó mal, mientras esté aprobada podés volverla a borrador y regenerarla.'
        },
        {
          icon: 'logout',
          titulo: 'Liquidación final (finiquito)',
          paraQue: 'Es el pago final cuando un empleado deja la empresa. El sistema calcula la antigüedad, el preaviso, la indemnización (si corresponde), las vacaciones no tomadas y el aguinaldo proporcional, y descuenta lo que el empleado todavía debe.',
          pasos: [
            'Entrá al Legajo del funcionario y tocá "Liquidación final".',
            'En el diálogo elegí el motivo de la salida, la fecha, y ajustá lo que haga falta (preaviso, días de vacaciones, toggles de descuentos). Todo viene precargado y editable.',
            'El sistema muestra el desglose y el total a pagar. Podés editar los ítems si negociás algo.',
            'Aprobá y pagá desde la Caja Mayor. El empleado queda inactivo.',
            'Imprimí el recibo del finiquito (PDF o Ticket).'
          ],
          tip: 'El preaviso cambia según el caso: en un despido injustificado sin preaviso se PAGA; en una renuncia sin preaviso se DESCUENTA la mitad de los días. El sistema lo resuelve solo según el motivo.'
        }
      ]
    },
    {
      nombre: 'Seguimiento y ajustes',
      icon: 'insights',
      secciones: [
        {
          icon: 'dashboard',
          titulo: 'Panel (Dashboard)',
          paraQue: 'Es la puerta de entrada al módulo y el resumen del sector: indicadores del mes, el gráfico de la nómina, rankings y una lista de empleados con datos incompletos para completar.',
          pasos: [
            'Entrá a R.R.H.H. → Dashboard RRHH.',
            'Elegí el período (mes) arriba y tocá "Aplicar": los indicadores del mes se recalculan.',
            'Arriba ves 4 indicadores clave: funcionarios activos, nómina del mes, liquidaciones pendientes y vacaciones por vencer.',
            'El gráfico muestra la nómina de los últimos 12 meses. A la derecha, rankings: top de deuda (vales + préstamos), top de horas extra y cumpleaños del mes.',
            'La lista "Legajos por completar" muestra a los empleados con datos faltantes, de peor a mejor. Tocá una fila para abrir su legajo y completarlo.',
            'Con los accesos rápidos entrás a Liquidaciones, Vales, Préstamos y al menú de Reportes.'
          ],
          tip: 'El gráfico de nómina de 12 meses no depende del período que elijas: es histórico. El filtro de período afecta solo a los indicadores y rankings del mes.'
        },
        {
          icon: 'summarize',
          titulo: 'Reportes',
          paraQue: 'Sirve para generar informes en PDF para imprimir o archivar: la nómina del mes, el resumen de IPS, los vales pendientes, los préstamos activos y el aguinaldo del año.',
          pasos: [
            'Entrá a R.R.H.H. → Dashboard RRHH.',
            'Tocá el botón "Reportes" (es un menú dentro del panel; ya no es una pantalla aparte).',
            'Elegí el reporte que necesités. Usa el período que tengas elegido en el panel.',
            'El PDF se abre en pantalla, listo para imprimir o guardar.'
          ]
        },
        {
          icon: 'settings',
          titulo: 'Configuración',
          paraQue: 'Son los parámetros que usa el módulo para sus cálculos: porcentajes de IPS, recargos de horas extra, días de vacaciones, indemnización, preaviso, tolerancia de tardanza, días de aviso, etc.',
          pasos: [
            'Entrá a R.R.H.H. → Configuración → Configuración RRHH.',
            'Los parámetros están organizados en pestañas por tema (IPS y aportes, Indemnización y finiquito, Vacaciones, Aguinaldo, Horas extra, Tardanza, General).',
            'Cada campo tiene su etiqueta, una ayuda y un botón de información con un ejemplo.',
            'Cambiá el valor solo si sabés qué afecta; se guarda al modificarlo.'
          ],
          tip: 'Esta pantalla la maneja normalmente el encargado. Un cambio acá afecta los cálculos de todos.'
        }
      ]
    },
    {
      nombre: 'App del empleado',
      icon: 'smartphone',
      secciones: [
        {
          icon: 'phone_android',
          titulo: 'Mis RRHH (en el celular)',
          paraQue: 'Es lo que el empleado ve en su celular: su saldo de vacaciones, sus vales, sus recibos y sus marcaciones. También puede pedir un vale o pedir vacaciones.',
          pasos: [
            'El empleado abre la app "Bodega Franco" y entra a "Mis RRHH".',
            'Ve su resumen y puede tocar cada sección (recibos, vales, vacaciones, marcaciones).',
            'Puede ver el recibo de sueldo en PDF.',
            'Puede solicitar un vale o vacaciones; quedan pendientes de aprobación.'
          ]
        },
        {
          icon: 'how_to_reg',
          titulo: 'Aprobaciones (para encargados)',
          paraQue: 'Sirve para que un encargado apruebe desde el celular las vacaciones que pidió el personal.',
          pasos: [
            'El encargado entra a "Aprobaciones" en la app (necesita el permiso correspondiente).',
            'Ve las vacaciones pendientes y las aprueba.',
            'Los vales pendientes se ven, pero se confirman desde el sistema de escritorio (porque mueven la caja).'
          ]
        }
      ]
    }
  ];
}

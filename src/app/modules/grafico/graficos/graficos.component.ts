import { Component, OnInit, AfterViewInit, inject, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { EChartsOption } from 'echarts';
import { TabService } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { ProductoVendidoComponent } from '../producto-vendido/producto-vendido.component';

import { FormaPagoComponent } from '../forma-pago/forma-pago.component';
import { VentaFuncionarioComponent } from '../venta-funcionario/venta-funcionario.component';
import { VentasDiasComponent } from '../ventas-dias/ventas-dias.component';
import { GraficoService } from '../grafico.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
// DESHABILITADO: Componente de ventas mensuales no se utiliza
// import { VentaMesComponent } from '../venta-mes/venta-mes.component';

@Component({
    selector: 'app-graficos',
    templateUrl: './graficos.component.html',
    styleUrls: ['./graficos.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraficosComponent implements OnInit, AfterViewInit {

    private ngZone = inject(NgZone);
    private tabService = inject(TabService);
    private graficoService = inject(GraficoService);

    // Colores del sistema (consistentes con Material theme)
    colores = {
        primary: '#689F38',      // light-green-700
        primaryLight: '#8BC34A', // light-green-500
        primaryDark: '#558B2F',  // light-green-800
        accent: '#009688',       // teal-500
        accentLight: '#4DB6AC',  // teal-300
        warn: '#F44336',         // red-500
        warnLight: '#EF5350',    // red-400
        background: '#424242',   // gris oscuro del sidebar
        backgroundDark: '#303030',
        text: '#E0E0E0',
        textSecondary: '#9E9E9E',
        success: '#4CAF50',
        warning: '#FF9800',
        info: '#2196F3'
    };

    // Datos mock para las sucursales
    sucursales = ['Canindeyu 1', 'Curuguaty 2', 'Paloma 2', 'Renacer', 'KM2', 'Fiesta'];
    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Opciones de los gráficos
    ventasPorSucursalOptions: EChartsOption = {};
    evolucionVentasOptions: EChartsOption = {};
    formasPagoOptions: EChartsOption = {};
    gastosCategoriaOptions: EChartsOption = {};
    ingresosGastosOptions: EChartsOption = {};
    ventasHoraOptions: EChartsOption = {};
    ventasFuncionarioOptions: EChartsOption = {};
    productosMasVendidosOptions: EChartsOption = {};

    // KPIs
    kpis = {
        ventasHoy: 45680000,
        ventasAyer: 42350000,
        gastosHoy: 8500000,
        creditosActivos: 156,
        creditosVencidos: 23,
        cajasTotales: 18,
        cajasAbiertas: 12
    };

    constructor() { }

    ngOnInit(): void {
        // Inicializar datos no visuales
    }

    ngAfterViewInit(): void {
        // Retrasar la inicialización y escalonarla para mejorar el rendimiento de inicio
        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
                this.initChartsGroup1();
            }, 100);

            setTimeout(() => {
                this.initChartsGroup2();
            }, 300);

            setTimeout(() => {
                this.initChartsGroup3();
            }, 500);
        });
    }

    onChartClick(type: string): void {
        switch (type) {
            case 'productos':
                this.tabService.addTab(new Tab(ProductoVendidoComponent, 'Productos Vendidos', null, null));
                break;

            case 'pago':
                this.tabService.addTab(new Tab(FormaPagoComponent, 'Formas de Pago', null, null));
                break;
            case 'funcionario':
                this.tabService.addTab(new Tab(VentaFuncionarioComponent, 'Ventas por Funcionario', null, null));
                break;
            case 'hora':
                this.tabService.addTab(new Tab(VentasDiasComponent, 'Ventas por Hora', null, null));
                break;
            // DESHABILITADO: Componente de ventas mensuales no se utiliza
            // case 'venta-mes':
            //     this.tabService.addTab(new Tab(VentaMesComponent, 'Ventas Mensuales', null, null));
            //     break;
        }
    }

    private initChartsGroup1(): void {
        // 1. Ventas por Sucursal
        this.ventasPorSucursalOptions = {
            title: {
                text: 'Ventas por Sucursal',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => `${params[0].name}<br/>Ventas: ₲ ${params[0].value.toLocaleString()}`
            },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: {
                type: 'category',
                data: this.sucursales,
                axisLabel: { color: this.colores.textSecondary, rotate: 30 },
                axisLine: { lineStyle: { color: '#555' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: this.colores.textSecondary,
                    formatter: (value: number) => (value / 1000000).toFixed(0) + 'M'
                },
                splitLine: { lineStyle: { color: '#444' } }
            },
            series: [{
                name: 'Ventas',
                type: 'bar',
                data: [85000000, 72000000, 68000000, 91000000, 54000000, 78000000],
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: this.colores.primaryLight },
                            { offset: 1, color: this.colores.primaryDark }
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }]
        };

        // DESHABILITADO: Gráfico de ventas mensuales no se utiliza
        /*
        // 2. Evolución de Ventas Mensual
        this.evolucionVentasOptions = {
            title: {
                text: 'Evolución de Ventas Mensual',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
            },
            tooltip: { trigger: 'axis' },
            legend: {
                data: ['2025', '2026'],
                bottom: 5,
                textStyle: { color: this.colores.textSecondary }
            },
            grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
            xAxis: {
                type: 'category',
                data: this.meses,
                axisLabel: { color: this.colores.textSecondary },
                axisLine: { lineStyle: { color: '#555' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: this.colores.textSecondary,
                    formatter: (value: number) => (value / 1000000).toFixed(0) + 'M'
                }
            },
            series: [
                {
                    name: '2025',
                    type: 'line',
                    smooth: true,
                    data: [320000000, 290000000, 380000000, 420000000, 350000000, 410000000,
                        480000000, 520000000, 440000000, 490000000, 560000000, 620000000],
                    lineStyle: { color: this.colores.primary, width: 3 },
                    symbol: 'circle',
                    itemStyle: { color: this.colores.primary }
                },
                {
                    name: '2026',
                    type: 'line',
                    smooth: true,
                    data: [380000000, null, null, null, null, null, null, null, null, null, null, null],
                    lineStyle: { color: this.colores.accent, width: 3 },
                    symbol: 'circle',
                    itemStyle: { color: this.colores.accent }
                }
            ]
        };
        */
    }

    private initChartsGroup2(): void {
        // 3. Formas de Pago
        this.formasPagoOptions = {
            title: {
                text: 'Formas de Pago',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
            },
            tooltip: { trigger: 'item', formatter: '{b}: ₲ {c} ({d}%)' },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: { color: this.colores.textSecondary }
            },
            series: [{
                name: 'Forma de Pago',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['40%', '55%'],
                data: [
                    { value: 450000000, name: 'Efectivo', itemStyle: { color: this.colores.primary } },
                    { value: 180000000, name: 'Tarjeta', itemStyle: { color: this.colores.accent } },
                    { value: 95000000, name: 'Convenio', itemStyle: { color: this.colores.warning } },
                    { value: 65000000, name: 'Transferencia', itemStyle: { color: this.colores.info } },
                    { value: 25000000, name: 'Cheque', itemStyle: { color: this.colores.accentLight } }
                ]
            }]
        };

        // 4. Gastos por Categoría
        this.gastosCategoriaOptions = {
            title: {
                text: 'Gastos por Categoría',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
            },
            grid: { left: '25%', right: '10%', bottom: '10%', top: '15%' },
            xAxis: { type: 'value' },
            yAxis: {
                type: 'category',
                data: ['Alimentación', 'Transporte', 'Servicios', 'Mantenimiento', 'Salarios', 'Otros'],
                axisLabel: { color: this.colores.textSecondary }
            },
            series: [{
                name: 'Gastos',
                type: 'bar',
                data: [12000000, 18500000, 8200000, 15600000, 85000000, 6800000],
                itemStyle: { color: this.colores.warn, borderRadius: [0, 4, 4, 0] }
            }]
        };

        // 5. Ingresos vs Gastos
        this.ingresosGastosOptions = {
            title: {
                text: 'Ingresos vs Gastos Mensual',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
            },
            legend: {
                data: ['Ingresos', 'Gastos'],
                bottom: 5,
                textStyle: { color: this.colores.textSecondary }
            },
            xAxis: {
                type: 'category',
                data: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
            },
            yAxis: { type: 'value' },
            series: [
                {
                    name: 'Ingresos',
                    type: 'bar',
                    data: [480000000, 520000000, 440000000, 490000000, 560000000, 620000000],
                    itemStyle: { color: this.colores.primary, borderRadius: [4, 4, 0, 0] }
                },
                {
                    name: 'Gastos',
                    type: 'bar',
                    data: [145000000, 152000000, 138000000, 148000000, 165000000, 178000000],
                    itemStyle: { color: this.colores.warn, borderRadius: [4, 4, 0, 0] }
                }
            ]
        };
    }

    private initChartsGroup3(): void {
        // 6. Ventas por Hora
        // 6. Ventas por Hora
        const today = new Date();
        const datePipe = new DatePipe('en-US');
        const hoyStr = datePipe.transform(today, 'yyyy-MM-dd') || '';

        this.graficoService.obtenerVentasPorHora(hoyStr).subscribe(res => {
            const horas = Array.from({ length: 15 }, (_, i) => (i + 7).toString()); // 7 to 21
            const data = new Array(15).fill(0);

            if (res) {
                res.forEach((item: any) => {
                    const idx = item.hora - 7;
                    if (idx >= 0 && idx < 15) {
                        data[idx] = item.total;
                    }
                });
            }

            this.ventasHoraOptions = {
                title: {
                    text: 'Ventas por Hora del Día (Hoy)',
                    left: 'center',
                    textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
                },
                tooltip: {
                    trigger: 'axis',
                    formatter: (params: any) => {
                        const val = params[0].value;
                        return `Hora: ${params[0].name}:00<br/>Venta: ₲ ${val.toLocaleString('es-PY')}`;
                    }
                },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: horas, // ['7', '8', ... '21']
                    axisLabel: { color: this.colores.textSecondary },
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        color: this.colores.textSecondary,
                        formatter: (value: number) => {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                            return value.toString();
                        }
                    },
                    splitLine: { lineStyle: { color: '#444' } }
                },
                series: [{
                    name: 'Ventas',
                    type: 'line',
                    smooth: true,
                    data: data,
                    areaStyle: { color: 'rgba(0, 150, 136, 0.3)' },
                    lineStyle: { color: this.colores.accent, width: 3 },
                    itemStyle: { color: this.colores.accent }
                }]
            };
        });

        // 7. Ventas por Funcionario

        const fechaInicio = datePipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd') || '';
        const fechaFin = datePipe.transform(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd') || '';

        this.graficoService.obtenerVentasPorFuncionario(fechaInicio, fechaFin).subscribe(res => {
            const nombres: string[] = [];
            const data: any[] = [];

            if (res) {
                res.slice(0, 10).forEach((item: any) => {
                    const nombre = item.persona?.nombre || item.funcionario || item.nickname || 'Unknown';
                    nombres.push(nombre);
                    // Check if sucursal-specific breakdown is needed or just total
                    // The backend returns a list of VentaPorFuncionario.
                    // For this overview chart, we can just show total sales per employee.
                    // The stack logic in mock was per-branch, but data is per-employee.
                    // So we simplification: Single bar per employee.
                    data.push(item.total);
                });
            }

            this.ventasFuncionarioOptions = {
                title: {
                    text: 'Ventas por Funcionario (Top 10 - Este Mes)',
                    left: 'center',
                    textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params: any) => {
                        return `${params[0].name}<br/>Venta: ₲ ${Number(params[0].value).toLocaleString('es-PY')}`;
                    }
                },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value' },
                yAxis: {
                    type: 'category',
                    data: nombres
                },
                series: [
                    {
                        name: 'Total',
                        type: 'bar',
                        data: data,
                        itemStyle: { color: this.colores.primary }
                    }
                ]
            };
        });

        // 8. Productos más Vendidos
        this.productosMasVendidosOptions = {
            title: {
                text: 'Top 10 Productos Más Vendidos',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 14, fontWeight: 'bold' }
            },
            legend: { bottom: 5, textStyle: { color: this.colores.textSecondary, fontSize: 10 } },
            grid: { left: '20%', right: '4%', bottom: '18%', top: '15%' },
            xAxis: { type: 'value' },
            yAxis: {
                type: 'category',
                data: ['Cerveza Brahma 1L', 'Coca Cola 2L', 'Hielo 5kg', 'Cerveza Pilsen Lata', 'Agua Mineral 500ml', 'Gaseosa Pepsi 2L', 'Vino Tinto 750ml', 'Cerveza Corona', 'Energizante Red Bull', 'Whisky J. Walker']
            },
            series: [
                { name: 'Canindeyu 1', type: 'bar', stack: 'total', data: [1250, 980, 850, 720, 650, 580, 420, 380, 320, 280] },
                { name: 'Curuguaty 2', type: 'bar', stack: 'total', data: [980, 1100, 720, 650, 580, 490, 380, 290, 250, 180] },
                { name: 'Renacer', type: 'bar', stack: 'total', data: [720, 650, 920, 480, 420, 380, 290, 250, 180, 150] }
            ]
        };
    }

    formatCurrency(value: number): string {
        return '₲ ' + value.toLocaleString('es-PY');
    }

    getVariacion(actual: number, anterior: number): number {
        return ((actual - anterior) / anterior) * 100;
    }
}

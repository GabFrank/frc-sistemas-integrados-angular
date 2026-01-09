import { Component, OnInit, AfterViewInit, inject, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { EChartsOption } from 'echarts';
import { TabService } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { ProductoVendidoComponent } from '../producto-vendido/producto-vendido.component';

import { FormaPagoComponent } from '../forma-pago/forma-pago.component';
import { VentaFuncionarioComponent } from '../venta-funcionario/venta-funcionario.component';
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
        this.ventasHoraOptions = {
            title: {
                text: 'Ventas por Hora del Día',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']
            },
            yAxis: { type: 'value' },
            series: [{
                name: 'Ventas',
                type: 'line',
                smooth: true,
                data: [5000000, 12000000, 28000000, 35000000, 52000000, 68000000, 45000000, 38000000, 42000000, 55000000, 72000000, 85000000, 78000000, 62000000, 35000000],
                areaStyle: { color: 'rgba(0, 150, 136, 0.3)' },
                lineStyle: { color: this.colores.accent, width: 3 }
            }]
        };

        // 7. Ventas por Funcionario
        this.ventasFuncionarioOptions = {
            title: {
                text: 'Ventas por Funcionario (Top 10)',
                left: 'center',
                textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
            },
            legend: {
                data: ['Canindeyu 1', 'Curuguaty 2', 'Renacer'],
                bottom: 5,
                textStyle: { color: this.colores.textSecondary }
            },
            xAxis: { type: 'value' },
            yAxis: {
                type: 'category',
                data: ['María López', 'Juan Pérez', 'Ana García', 'Carlos Ruiz', 'Sofia Mendez', 'Diego Torres', 'Laura Sánchez', 'Pedro Gómez', 'Lucía Fernández', 'Roberto Silva']
            },
            series: [
                { name: 'Canindeyu 1', type: 'bar', stack: 'total', data: [45000000, 38000000, 0, 28000000, 0, 22000000, 0, 18000000, 0, 12000000] },
                { name: 'Curuguaty 2', type: 'bar', stack: 'total', data: [0, 0, 42000000, 0, 35000000, 0, 25000000, 0, 15000000, 0] },
                { name: 'Renacer', type: 'bar', stack: 'total', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 8000000] }
            ]
        };

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

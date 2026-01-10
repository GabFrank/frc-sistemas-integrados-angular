import { Component, OnInit, AfterViewInit, inject, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { EChartsOption } from 'echarts';
import { TabService } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { ProductoVendidoComponent } from '../producto-vendido/producto-vendido.component';

import { FormaPagoComponent } from '../forma-pago/forma-pago.component';
import { VentaFuncionarioComponent } from '../venta-funcionario/venta-funcionario.component';
import { VentasDiasComponent } from '../ventas-dias/ventas-dias.component';
import { GastoCategoriaComponent } from '../gasto-categoria/gasto-categoria.component';
import { IngresoGastoComponent } from '../ingreso-gasto/ingreso-gasto.component';
import { VentaSucursalComponent } from '../venta-sucursal/venta-sucursal.component';
import { GraficoService } from '../grafico.service';
import { DatePipe } from '@angular/common';

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

    colores = {
        primary: '#689F38',
        primaryLight: '#8BC34A',
        primaryDark: '#558B2F',
        accent: '#009688',
        accentLight: '#4DB6AC',
        warn: '#F44336',
        warnLight: '#EF5350',
        background: '#424242',
        backgroundDark: '#303030',
        text: '#E0E0E0',
        textSecondary: '#9E9E9E',
        success: '#4CAF50',
        warning: '#FF9800',
        info: '#2196F3'
    };

    sucursales = ['Canindeyu 1', 'Curuguaty 2', 'Paloma 2', 'Renacer', 'KM2', 'Fiesta'];
    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    ventasPorSucursalOptions: EChartsOption = {};
    evolucionVentasOptions: EChartsOption = {};
    formasPagoOptions: EChartsOption = {};
    gastosCategoriaOptions: EChartsOption = {};
    ingresosGastosOptions: EChartsOption = {};
    ventasHoraOptions: EChartsOption = {};
    ventasFuncionarioOptions: EChartsOption = {};
    productosMasVendidosOptions: EChartsOption = {};

    constructor() { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
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
            case 'gasto-categoria':
                this.tabService.addTab(new Tab(GastoCategoriaComponent, 'Gastos por Categoría', null, null));
                break;
            case 'funcionario':
                this.tabService.addTab(new Tab(VentaFuncionarioComponent, 'Ventas por Funcionario', null, null));
                break;
            case 'hora':
                this.tabService.addTab(new Tab(VentasDiasComponent, 'Ventas por Hora', null, null));
                break;
            case 'ingreso-gasto':
                this.tabService.addTab(new Tab(IngresoGastoComponent, 'Ingresos vs Gastos', null, null));
                break;
            case 'venta-sucursal':
                this.tabService.addTab(new Tab(VentaSucursalComponent, 'Ventas por Sucursal', null, null));
                break;
        }
    }

    private initChartsGroup1(): void {
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
    }

    private initChartsGroup2(): void {
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

        const today = new Date();
        const datePipe = new DatePipe('en-US');
        const inicioStr = datePipe.transform(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd') || '';
        const finStr = datePipe.transform(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd') || '';

        this.graficoService.obtenerGastosPorCategoria(inicioStr, finStr).subscribe(res => {
            const data = res || [];
            const sortedData = [...data].sort((a, b) => a.total - b.total);
            const categories = sortedData.map(d => d.categoria || 'Sin Categoría');
            const values = sortedData.map(d => d.total);

            this.gastosCategoriaOptions = {
                title: {
                    text: 'Gastos por Categoría (Mes Actual)',
                    left: 'center',
                    textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params: any) => {
                        const p = params[0];
                        return `${p.name}<br/>Monto: ₲ ${p.value.toLocaleString('es-PY')}`;
                    }
                },
                grid: { left: '25%', right: '10%', bottom: '10%', top: '15%' },
                xAxis: {
                    type: 'value',
                    axisLabel: {
                        color: this.colores.textSecondary,
                        formatter: (value: number) => {
                            if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                            return value.toString();
                        }
                    },
                    splitLine: { lineStyle: { color: '#444' } }
                },
                yAxis: {
                    type: 'category',
                    data: categories,
                    axisLabel: { color: this.colores.textSecondary },
                    splitLine: { show: false }
                },
                series: [{
                    name: 'Gastos',
                    type: 'bar',
                    data: values,
                    itemStyle: { color: this.colores.warn, borderRadius: [0, 4, 4, 0] }
                }]
            };
        });

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
                    data: horas,
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

        const fechaInicio = datePipe.transform(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd') || '';
        const fechaFin = datePipe.transform(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd') || '';

        this.graficoService.obtenerVentasPorFuncionario(fechaInicio, fechaFin).subscribe(res => {
            const nombres: string[] = [];
            const data: any[] = [];

            if (res) {
                res.slice(0, 10).forEach((item: any) => {
                    const nombre = item.persona?.nombre || item.funcionario || item.nickname || 'Unknown';
                    nombres.push(nombre);
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

}

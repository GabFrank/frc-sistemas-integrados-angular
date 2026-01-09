import { Component, OnInit, inject } from '@angular/core';
import { GraficoService } from '../grafico.service';
import { DatePipe } from '@angular/common';
import { EChartsOption } from 'echarts';
import { FormControl } from '@angular/forms';
import { SucursalService } from '../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'ventas-dias',
  templateUrl: './ventas-dias.component.html',
  styleUrls: ['./ventas-dias.component.scss']
})
export class VentasDiasComponent implements OnInit {

  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);
  private datePipe = new DatePipe('en-US');

  sucursalControl = new FormControl(null);
  sucursales$: Observable<Sucursal[]>;

  echartsOption: EChartsOption;
  cargando = false;

  ngOnInit(): void {
    this.sucursales$ = this.sucursalService.onGetAllSucursales(true);
    this.cargarDatos();

    this.sucursalControl.valueChanges.subscribe(() => {
      this.cargarDatos();
    });
  }

  cargarDatos() {
    this.cargando = true;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = this.datePipe.transform(today, 'yyyy-MM-dd') || '';
    const yesterdayStr = this.datePipe.transform(yesterday, 'yyyy-MM-dd') || '';

    const sucId = this.sucursalControl.value;

    const reqHoy = this.graficoService.obtenerVentasPorHora(todayStr, sucId);
    const reqAyer = this.graficoService.obtenerVentasPorHora(yesterdayStr, sucId);
    import('rxjs').then(({ forkJoin }) => {
      forkJoin([reqHoy, reqAyer]).subscribe(([dataHoy, dataAyer]) => {
        this.configurarGrafico(dataHoy, dataAyer);
        this.cargando = false;
      });
    });
  }

  configurarGrafico(dataHoy: any[], dataAyer: any[]) {
    const hours = Array.from({ length: 15 }, (_, i) => (i + 7).toString());

    const valuesHoy = new Array(15).fill(0);
    const valuesAyer = new Array(15).fill(0);

    dataHoy.forEach((item: any) => {
      const idx = item.hora - 7;
      if (idx >= 0 && idx < 15) valuesHoy[idx] = item.total;
    });

    dataAyer.forEach((item: any) => {
      const idx = item.hora - 7;
      if (idx >= 0 && idx < 15) valuesAyer[idx] = item.total;
    });

    this.echartsOption = {
      title: {
        text: 'Comparativo de Ventas por Hora (Ayer vs Hoy)',
        left: 'center',
        textStyle: { color: '#E0E0E0' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let res = `Hora: ${params[0].name}:00<br/>`;
          params.forEach((p: any) => {
            res += `${p.marker} ${p.seriesName}: ₲ ${p.value.toLocaleString('es-PY')}<br/>`;
          });
          return res;
        }
      },
      legend: {
        data: ['Ayer', 'Hoy'],
        bottom: 10,
        textStyle: { color: '#E0E0E0' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLabel: { color: '#9E9E9E' }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#9E9E9E',
          formatter: (value: number) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            return value.toString();
          }
        },
        splitLine: {
          lineStyle: {
            color: '#444'
          }
        }
      },
      series: [
        {
          name: 'Ayer',
          type: 'line',
          data: valuesAyer,
          smooth: true,
          lineStyle: { width: 3, color: '#FF9800' }, // Orange for yesterday
          itemStyle: { color: '#FF9800' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(255, 152, 0, 0.3)' }, { offset: 1, color: 'rgba(255, 152, 0, 0)' }]
            }
          }
        },
        {
          name: 'Hoy',
          type: 'line',
          data: valuesHoy,
          smooth: true,
          lineStyle: { width: 4, color: '#009688' }, // Teal/Green for today
          itemStyle: { color: '#009688' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(0, 150, 136, 0.5)' }, { offset: 1, color: 'rgba(0, 150, 136, 0)' }]
            }
          }
        }
      ]
    };
  }
}

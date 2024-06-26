import {Component, Inject, OnInit} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle
} from "@angular/material/card";
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogRef} from "@angular/material/dialog";
import {DataService} from "../../services/data.service";
import { createChart,CrosshairMode, ISeriesApi } from 'lightweight-charts';
import {symbols} from "../transaction/OperationAction";
import {NgClass, NgForOf, NgIf, NgStyle} from "@angular/common";
import {MatList, MatListItem} from "@angular/material/list";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";

@Component({
  selector: 'app-compare-chart',
  standalone: true,
  imports: [
    MatButton,
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatDialogActions,
    MatDialogClose,
    NgForOf,
    NgIf,
    MatList,
    MatListItem,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRowDef,
    MatRow,
    NgClass,
    NgStyle
  ],
  templateUrl: './compare-chart.component.html',
  styleUrl: './compare-chart.component.css'
})
export class CompareChartComponent implements OnInit{
  private chart: any;
  private candlestickSeries: any;

  tickerName: string = '';
  lastValue: number = 0;
  currency: string = '';

  stockData: any []= [];
  tickers: any[]= this.data.symbols;
  tickersStr: string[] = [];
  colors = ['#abece4', '#c4d004', '#926d40', '#fb7991', '#ff9f15'];
  correlation: any[]= [];
  correlationData: { key: string, value: unknown }[] = [];

  displayedColumns: string[] = ['key', 'value'];

  constructor(private stockService: DataService, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<CompareChartComponent>) {
    this.tickers = data.symbols;
    for (let i = 0; i < this.tickers.length; i++) {
      this.tickersStr.push(this.tickers[i].valor);
    }
    console.log(this.tickersStr);

  }
  async ngOnInit() {
    await this.loadStockData();
    this.createChart();
    const requestBody = {
      tickers: this.tickersStr
    };
    this.stockService.getCorrelation(requestBody).subscribe((data: any) => {
      this.correlationData = Object.entries(data).map(([key, value]) => ({ key, value }));
      console.log('Correlación:', this.correlationData);
      for (let i = 0; i < data.length; i++) {
        this.correlation.push(data[i]);
      }
      console.log(this.correlation);
      console.log('Correlación:', data);
      this.processCorrelationData(data);
    });

  }
  dataSource: any[] = [];

  processCorrelationData(data: any) {
    const tickers = this.tickersStr;

    this.displayedColumns = ['ticker', ...tickers];

    this.dataSource = tickers.map(ticker => {
      const row: any = { ticker };
      tickers.forEach(t => {
        const correlationKey1 = `${ticker}-${t}`;
        const correlationKey2 = `${t}-${ticker}`;
        if (ticker === t) {
          row[t] = '1.000';
        } else if (data[correlationKey1] !== undefined) {
          row[t] = data[correlationKey1].toFixed(3);
        } else if (data[correlationKey2] !== undefined) {
          row[t] = data[correlationKey2].toFixed(3);
        } else {
          row[t] = '';
        }
      });
      return row;
    });

    console.log('dataSource:', this.dataSource);
  }

  getBackgroundColor(value: number | string): string {

    const val = typeof value === 'string' ? parseFloat(value) : value;
    const redColor = [242, 80, 110];
    const greenColor = [124, 161, 43];
    const color = val < 0 ? redColor : greenColor;
    const intensity = Math.abs(val) * 0.5; // Adjust the intensity as needed
    return `rgba(${color[0]},${color[1]},${color[2]},${intensity})`;
  }

  getStockName() {
    for (let i = 0; i < this.tickers.length; i++) {
      this.stockService.getStockName(this.tickers[i]).subscribe((data: any) => {
        this.tickerName = data;
      });
    }
  }
  getLastValue() {
    for (let i = 0; i < this.tickers.length; i++) {
      this.stockService.getStockLastValue(this.tickers[i]).subscribe((data: any) => {

        this.lastValue = data.last_value;
        this.currency = data.currency;
      });
    }
  }
  async loadStockData() {
    const promises: Promise<any>[] = [];

    for (let i = 0; i < this.tickers.length; i++) {
      const symbol = this.tickers[i].valor;
      promises.push(this.stockService.getStockData(symbol).toPromise());
    }
    this.stockData = await Promise.all(promises);
    console.log('Datos de las acciones:', this.stockData);

  }

  createChart() {

    const container = document.getElementById("chart-container" );

    if (!container) {
      return;
    }

    this.chart = createChart(container, {
      width: 700,
      height: 350,
      layout: {
        background: {color: '#140F1C'},
        textColor: 'white',
      },
      leftPriceScale: {
        scaleMargins: {
          top: 0.3,
          bottom: 0.25,
        },
        visible: true,
        borderVisible: false,
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
    });

    for (let i = 0; i < this.stockData.length; i++) {
      const lineSeries = this.chart.addLineSeries({ color: this.colors[i] });
      lineSeries.setData(this.stockData[i]);
    }

    this.chart.timeScale().fitContent();

  }
}

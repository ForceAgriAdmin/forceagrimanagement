// src/app/services/printing.service.ts

import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { WorkersService } from './workerservice.service';
import { firstValueFrom } from 'rxjs';
import jspdf from 'jspdf';

export interface CardConfig {
  worker: any;
  operation: any;
  farm: any;
  identityCard: { number: string };
}

@Injectable({
  providedIn: 'root',
})
export class PrintingService {
  constructor(private workersService: WorkersService) {}

  // ─────────────────────────────────────────────────────────
  // 1) REPORT GENERATOR
  // ─────────────────────────────────────────────────────────
  async generatePdf(config: {
    reportName: string;
    from: Date;
    to: Date;
    logoUrl: string;
    columns: { label: string; key: string }[];
    rows: any[];
    fileName: string;
  }) {
    // Create a container DIV to hold the report HTML
    const container = document.createElement('div');
    container.style.width = '297mm';
    container.style.padding = '16px';
    container.style.background = 'white';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = 'Roboto, sans-serif';
    container.style.color = '#333';
    container.innerHTML = this.buildReportHtml(config);
    document.body.appendChild(container);

    // Render the HTML to a canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,       // ensure CORS is allowed for remote images
      allowTaint: true,
      backgroundColor: 'white'
    });

    // Create the PDF (A4 landscape)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Convert the canvas to PNG and add it to the PDF
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Save and clean up
    pdf.save(`${config.fileName}.pdf`);
    document.body.removeChild(container);
  }

  // A quick method to capture an element and save as PDF (unused in report).
  generatePdfwww() {
    const elementToPrint = document.getElementById('WorkerIdCard');
    if (elementToPrint) {
      html2canvas(elementToPrint).then((canvas) => {
        const pdf = new jspdf('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('document.pdf');
      });
    }
  }

  /**
   * Build the HTML string for a tabular report:
   * - Reorders the “amount” column to be last
   * - Inserts a dynamic <img> tag for logoUrl with crossorigin="anonymous"
   * - Renders header, table rows, and a “Total” row at the bottom
   */
  private buildReportHtml(cfg: {
    reportName: string;
    from: Date;
    to: Date;
    logoUrl: string;
    columns: { label: string; key: string }[];
    rows: any[];
  }): string {
    // 1) Ensure 'amount' column is at the end
    const cols = [...cfg.columns];
    const amountIndex = cols.findIndex((c) => c.key.toLowerCase() === 'amount');
    if (amountIndex > -1 && amountIndex < cols.length - 1) {
      const [amountCol] = cols.splice(amountIndex, 1);
      cols.push(amountCol);
    }

    // 2) Header with dynamic logo
    const header = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <img 
          src="${cfg.logoUrl}" 
          style="height:80px; object-fit:contain" 
          alt="logo" 
          crossorigin="anonymous"
        />
        <div style="text-align:center">
          <h2 style="margin:0; font-size:18px">${cfg.reportName}</h2>
          <p style="margin:4px 0 0">
            From: ${cfg.from.toLocaleDateString()} 
            &nbsp;&nbsp; To: ${cfg.to.toLocaleDateString()}
          </p>
        </div>
        <div style="width:40px"></div>
      </div>`;

    // 3) Build table header (th) using reordered columns
    const ths = cols
      .map(
        (c) => `
        <th style="
          padding:8px;
          background:#f0f0f0;
          border:1px solid #ddd;
          font-weight:600;
          text-align:left">
          ${c.label}
        </th>`
      )
      .join('');

    // 4) Build table rows (tr)
    const trs = cfg.rows
      .map(
        (row) => `
        <tr>
          ${cols
            .map(
              (c) => `
            <td style="
              padding:8px;
              border:1px solid #ddd;
              text-align:left">
              ${row[c.key] ?? ''}
            </td>`
            )
            .join('')}
        </tr>`
      )
      .join('');

    // 5) Compute total using the last column (now ‘amount’)
    const lastColKey = cols[cols.length - 1].key;
    const totalValue = cfg.rows.reduce((sum, r) => {
      const raw = r[lastColKey];
      const num = typeof raw === 'number' ? raw : parseFloat(raw) || 0;
      return sum + num;
    }, 0);
    const formattedTotal = totalValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // 6) Build the Total row: label spans all but the last column
    const colspanCount = cols.length - 1;
    const totalRow = `
      <tr>
        <td
          style="
            padding:8px;
            border:1px solid #ddd;
            font-weight:600;
            text-align:right"
          colspan="${colspanCount}">
          Total
        </td>
        <td
          style="
            padding:8px;
            border:1px solid #ddd;
            font-weight:600;
            text-align:left">
          ${formattedTotal}
        </td>
      </tr>`;

    // 7) Assemble and return the complete HTML
    return (
      header +
      `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px; line-height:1.4">
          <thead>${ths}</thead>
          <tbody>
            ${trs}
            ${totalRow}
          </tbody>
        </table>
      </div>`
    );
  }

  // ─────────────────────────────────────────────────────────
  // 2) TWO-SIDED ID CARD GENERATOR
  // ─────────────────────────────────────────────────────────
  private readonly CARD_W = 85.6; // mm
  private readonly CARD_H = 53.98; // mm

  async printCardHtml(cfg: CardConfig) {
    // 1) Open a new tab/window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked – unable to open print window');
    }

    // 2) Fetch the worker’s profile image as a Data-URL
    const downloadUrl = await firstValueFrom(
      this.workersService.getProfileImageUrl(cfg.worker.profileImageUrl)
    );
    const blobImg = await fetch(downloadUrl).then((r) => r.blob());
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blobImg);
    });
    // Replace worker.profileImageUrl with Data-URL for inlining
    const workerWithInlineImage = {
      ...cfg.worker,
      profileImageUrl: dataUrl,
    };

    // 3) Build front & back HTML snippets
    const front = this.buildCardFront({
      ...cfg,
      worker: workerWithInlineImage,
    });
    const back = await this.buildCardBack(cfg);

    // 4) Combine into a full HTML document
    const fullHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ID Card ${cfg.identityCard.number}</title>
          <style>
            @page { size: ${this.CARD_W}mm ${this.CARD_H}mm; margin:0 }
            body { margin:0; padding:0 }
            .page {
              width: ${this.CARD_W}mm;
              height: ${this.CARD_H}mm;
              box-sizing: border-box;
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          <div class="page">${front}</div>
          <div class="page">${back}</div>
        </body>
      </html>`;

    // 5) Write into the popup and close document
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  }

  /**
   * Helper: Renders HTML (string) to a PNG Data-URL at specified dimensions (in mm).
   */
  private async renderHtmlToImage(html: string, wMM: number, hMM: number) {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      width: `${wMM}mm`,
      height: `${hMM}mm`,
      background: 'white',
      boxSizing: 'border-box',
      padding: '0',
      margin: '0',
    });
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      backgroundColor: 'white',
    });
    document.body.removeChild(wrapper);
    return canvas.toDataURL('image/png');
  }

  /**
   * Build the front side of the ID card as an HTML snippet.
   * Uses inline Data-URL for worker.profileImageUrl (already in cfg.worker).
   */
  private buildCardFront({
    worker,
    operation,
    farm,
    identityCard,
  }: CardConfig): string {
    const first = worker.firstName || '—';
    const last = worker.lastName || '—';
    const imgSrc = worker.profileImageUrl || 'assets/default-avatar.png';

    return `
      <div style="
        border: 0.5mm solid black;
        display: grid;
        grid-template-columns: 1fr 2fr;
        grid-template-rows: auto 1fr auto;
        gap: 2mm;
        width: 100%; height: 100%;
        font-family: Roboto, sans-serif;
      ">
        <!-- Avatar -->
        <div style="
          grid-column: 1 / 2;
          grid-row: 1 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img 
            src="${imgSrc}"
            crossorigin="anonymous"
            style="width:35mm; height:35mm; object-fit:cover; border-radius:4px"
          />
        </div>
        
        <!-- Details -->
        <div style="
          grid-column: 2 / 3;
          grid-row: 1 / 2;
          padding-left: 5mm;
          padding-top: 10mm;
          font-size: 8pt;
        ">
          <strong style="font-size:12pt">${first} ${last}</strong><br/>
          Emp #: ${worker.employeeNumber}<br/>
          ID #: ${worker.idNumber}<br/>
          Op: ${operation.name}<br/>
          Farm: ${farm.name}
        </div>

        <!-- Spacer (push details downward) -->
        <div style="
          grid-column: 2 / 3;
          grid-row: 2 / 3;
        "></div>

        <!-- Card number (bottom full-width) -->
        <div style="
          grid-column: 1 / 3;
          grid-row: 3 / 4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9pt;
          margin-bottom: 2mm;
        ">
          ${identityCard.number}
        </div>
      </div>`;
  }

  /**
   * Build the back side of the ID card (QR + barcode) as an HTML snippet.
   * We generate a QR code and a Code128 barcode as Data-URLs.
   */
  private async buildCardBack(cfg: CardConfig): Promise<string> {
    // 1) Build the QR’s value string
    const qrValue = [
      `card:${cfg.identityCard.number}`,
      `workerId:${cfg.worker.id}`,
      `farmId:${cfg.worker.farmId}`,
      `operationId:${cfg.worker.operationId}`,
    ].join('');

    // 2) Generate QR Data-URL
    const qrDataUrl = await QRCode.toDataURL(qrValue, {
      width: 150,
      margin: 0,
    });

    // 3) Generate Code128 barcode onto a canvas, then Data-URL
    const bcCanvas = document.createElement('canvas');
    JsBarcode(bcCanvas, cfg.identityCard.number, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0,
    });
    const bcDataUrl = bcCanvas.toDataURL('image/png');

    // 4) Return combined HTML snippet
    return `
      <div style="
        border: 0.5mm solid black;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%; height: 100%;
        padding: 2mm;
        font-family: Roboto, sans-serif;
      ">
        <!-- QR block (top half) -->
        <div style="
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 0mm;
        ">
          <img src="${qrDataUrl}"
               style="max-width:20mm;max-height:20mm;" />
        </div>

        <!-- Barcode + card number (bottom) -->
        <div style="
          flex: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 6mm;
        ">
          <img src="${bcDataUrl}"
               style="height:12mm; object-fit:contain;" />
          <div style="margin-top:1mm;font-size:9pt;">
            ${cfg.identityCard.number}
          </div>
        </div>
      </div>`;
  }

  /**
   * Print two ID cards side‐by‐side on an A4 (landscape). 
   * Inlines images, then arranges front and back in one PDF row.
   */
  async printCardOnA4(cfg: CardConfig) {
    // 1) Inline the worker’s profile image
    const downloadUrl = await firstValueFrom(
      this.workersService.getProfileImageUrl(cfg.worker.profileImageUrl)
    );
    const blob = await fetch(downloadUrl).then((r) => r.blob());
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    const frontCfg: CardConfig = {
      ...cfg,
      worker: { ...cfg.worker, profileImageUrl: dataUrl },
    };

    // 2) Render front + back into PNG Data-URLs
    const frontImg = await this.renderHtmlToImage(
      this.buildCardFront(frontCfg),
      this.CARD_W,
      this.CARD_H
    );
    const backImg = await this.renderHtmlToImage(
      await this.buildCardBack(cfg),
      this.CARD_W,
      this.CARD_H
    );

    // 3) Create an A4‐landscape PDF
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape',
    });
    const pageW = pdf.internal.pageSize.getWidth();  // ~297mm
    const pageH = pdf.internal.pageSize.getHeight(); // ~210mm

    // 4) Determine positions with a 10mm margin
    const cW = this.CARD_W;  // 85.6 mm
    const cH = this.CARD_H;  // 53.98 mm
    const margin = 10;       // 10 mm

    const x1 = margin; 
    const y1 = margin;
    const x2 = x1 + cW + margin;
    const y2 = margin;

    // 5) Draw front + border
    pdf.addImage(frontImg, 'PNG', x1, y1, cW, cH);
    pdf
      .setLineWidth(0.5)
      .setDrawColor(0, 0, 0)
      .rect(x1, y1, cW, cH);

    // Draw back + border
    pdf.addImage(backImg, 'PNG', x2, y2, cW, cH);
    pdf
      .setLineWidth(0.5)
      .setDrawColor(0, 0, 0)
      .rect(x2, y2, cW, cH);

    // 6) Save PDF
    pdf.save(`ID_Card_${cfg.identityCard.number}.pdf`);
  }
}

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
  providedIn: 'root'
})
export class PrintingService {

  constructor(private workersService: WorkersService){}
  // ─────────────────────────────────────────────────────────
  // 1) Your original report generator (UNCHANGED)
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
    // --- BEGIN your existing generatePdf implementation ---
    const container = document.createElement('div');
    container.style.width  = '297mm';
    container.style.padding = '16px';
    container.style.background = 'white';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = 'Roboto, sans-serif';
    container.style.color = '#333';
    container.innerHTML = this.buildReportHtml(config);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth  = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    pdf.save(`${config.fileName}.pdf`);
    document.body.removeChild(container);
    // --- END generatePdf ---
  }

  generatePdfwww() {
      const elementToPrint = document.getElementById('WorkerIdCard'); // Replace 'element-id' with the actual ID
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

async printCardHtml(cfg: CardConfig) {
  // 1) Open the tab immediately on click
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup blocked – unable to open print window');
  }

  // 2) Now do your async work
  const downloadUrl = await firstValueFrom(
    this.workersService.getProfileImageUrl(cfg.worker.profileImageUrl)
  );
  const blobImg = await fetch(downloadUrl).then(r => r.blob());
  const dataUrl = await new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blobImg);
  });
  const workerWithInlineImage = {
    ...cfg.worker,
    profileImageUrl: dataUrl
  };

  const front = this.buildCardFront({ ...cfg, worker: workerWithInlineImage });
  const back  = await this.buildCardBack(cfg);

  const fullHtml = `
    <!doctype html >
    <html>
    <div id="WorkerIdCard">
    <p>poes<p/>
    <div/>
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

   // this.generatePdfwww();
  // 3) Write into the already-opened tab
  printWindow.document.open();
  (printWindow.document as any).write(fullHtml);
  printWindow.document.close();
}



  private buildReportHtml(cfg: any): string {
    const header = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <img src="${cfg.logoUrl}" style="height:80px;object-fit:contain" alt="logo">
        <div style="text-align:center">
          <h2 style="margin:0;font-size:18px">${cfg.reportName}</h2>
          <p style="margin:4px 0 0">
            From: ${cfg.from.toLocaleDateString()} 
            &nbsp;&nbsp; To: ${cfg.to.toLocaleDateString()}
          </p>
        </div>
        <div style="width:40px"></div>
      </div>`;

    const ths = cfg.columns.map((c: any) => `
      <th style="padding:8px;background:#f0f0f0;border:1px solid #ddd;font-weight:600;text-align:left">
        ${c.label}
      </th>`).join('');

    const trs = cfg.rows.map((row: any) => `
      <tr>
        ${cfg.columns.map((c: any) => `
          <td style="padding:8px;border:1px solid #ddd">
            ${row[c.key] ?? ''}
          </td>`).join('')}
      </tr>`).join('');

    return header + `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;line-height:1.4">
          <thead>${ths}</thead>
          <tbody>${trs}</tbody>
        </table>
      </div>`;
  }

  // ─────────────────────────────────────────────────────────
  // 2) Your two-sided ID card printer (mostly unchanged)
  // ─────────────────────────────────────────────────────────
  private readonly CARD_W = 85.6;   // mm
  private readonly CARD_H = 53.98;  // mm

   async printCard(cfg: CardConfig) {
  // 1) Fetch & inline the profile image
  const downloadUrl = await firstValueFrom(
    this.workersService.getProfileImageUrl(cfg.worker.profileImageUrl)
  );
  const blob     = await fetch(downloadUrl).then(r => r.blob());
  const dataUrl  = await new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  const frontCfg: CardConfig = {
    ...cfg,
    worker: { ...cfg.worker, profileImageUrl: dataUrl }
  };

  // 2) Render front/back to PNG data-URLs
  const frontImg = await this.renderHtmlToImage(
    this.buildCardFront(frontCfg),
    this.CARD_W, this.CARD_H
  );
  const backHtml = await this.buildCardBack(cfg);
  const backImg  = await this.renderHtmlToImage(
    backHtml,
    this.CARD_W, this.CARD_H
  );

  // 3) Build a single‐page PDF that’s double‐wide:
  const totalW = this.CARD_W * 2;  // e.g. 171.2 mm
  const totalH = this.CARD_H;      // e.g. 53.98 mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [ totalW, totalH ]
  });

  // 4) Draw front at x=0, back at x=CARD_W
  // FRONT
  pdf.addImage(frontImg, 'PNG', 0, 0, this.CARD_W, this.CARD_H);
  pdf.setLineWidth(0.5).setDrawColor(0,0,0)
     .rect(0.5, 0.5, this.CARD_W-1, this.CARD_H-1);

  // BACK
  pdf.addImage(backImg, 'PNG', this.CARD_W, 0, this.CARD_W, this.CARD_H);
  pdf.setLineWidth(0.5).setDrawColor(0,0,0)
     .rect(this.CARD_W + 0.5, 0.5, this.CARD_W-1, this.CARD_H-1);

  // 5) Save
  pdf.save(`ID_Card_${cfg.identityCard.number}.pdf`);
}

async printCardOnA4(cfg: CardConfig) {
  // 1) Fetch & inline the image
  const downloadUrl = await firstValueFrom(
    this.workersService.getProfileImageUrl(cfg.worker.profileImageUrl)
  );
  const blob    = await fetch(downloadUrl).then(r => r.blob());
  const dataUrl = await new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  const frontCfg: CardConfig = {
    ...cfg,
    worker: { ...cfg.worker, profileImageUrl: dataUrl }
  };

  // 2) Render front + back into PNGs
  const frontImg = await this.renderHtmlToImage(
    this.buildCardFront(frontCfg),
    this.CARD_W, this.CARD_H
  );
  const backImg  = await this.renderHtmlToImage(
    await this.buildCardBack(cfg),
    this.CARD_W, this.CARD_H
  );

  // 3) Create A4‐landscape PDF
  const pdf = new jsPDF({
    unit:        'mm',
    format:      'a4',
    orientation: 'landscape'
  });
  const pageW = pdf.internal.pageSize.getWidth();   // ~297mm
  const pageH = pdf.internal.pageSize.getHeight();  // ~210mm

  // 4) Position both cards at top‐left
  const cW     = this.CARD_W;     // 85.6 mm
  const cH     = this.CARD_H;     // 53.98 mm
  const margin = 10;              // 10 mm margin

  const x1 = margin;              // front X
  const y1 = margin;              // front Y
  const x2 = x1 + cW + margin;    // back X
  const y2 = margin;              // back Y

  // 5) Draw front & back
  pdf.addImage(frontImg, 'PNG', x1, y1, cW, cH);
  pdf.setLineWidth(0.5).setDrawColor(0,0,0)
     .rect(x1, y1, cW, cH);

  pdf.addImage(backImg, 'PNG', x2, y2, cW, cH);
  pdf.setLineWidth(0.5).setDrawColor(0,0,0)
     .rect(x2, y2, cW, cH);

  // 6) Save
  pdf.save(`ID_Card_${cfg.identityCard.number}.pdf`);
}
  private async renderHtmlToImage(html: string, wMM: number, hMM: number) {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      width:  `${wMM}mm`,
      height: `${hMM}mm`,
      background: 'white',
      boxSizing: 'border-box',
      padding: '0',
      margin: '0'
    });
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      scale:    2,
      useCORS:  true,
      backgroundColor: 'white'
    });
    document.body.removeChild(wrapper);
    return canvas.toDataURL('image/png');
  }

//   private buildCardFront({ worker, operation, farm, identityCard }: CardConfig): string {
//   const first = worker.firstName || '—';
//   const last  = worker.lastName  || '—';
//   return `
//     <div style="
//       display: grid;
//       grid-template-columns: 1fr 2fr;
//       grid-template-rows: auto 1fr auto;
//       gap: 2mm;
//       width: 100%; height: 100%;
//       font-family: Roboto, sans-serif;
//     ">
      
//       <!-- Avatar -->
//       <div style="
//         grid-column: 1 / 2;
//         grid-row: 1 / 3;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//       ">
//         <img src="${worker.profileImageUrl || 'assets/default-avatar.png'}"
//              style="width:35mm;height:35mm;object-fit:cover;border-radius:4px" />
//       </div>
      
//       <!-- Details -->
//       <div style="
//         grid-column: 2 / 3;
//         grid-row: 1 / 2;
//         padding-left: 5mm;
//         padding-top: 10mm;
//         font-size: 8pt;
//       ">
//         <strong style="font-size:12pt">${first} ${last}</strong><br/>
//         Emp #: ${worker.employeeNumber}<br/>
//         ID #: ${worker.idNumber}<br/>
//         Op: ${operation.name}<br/>
//         Farm: ${farm.name}
//       </div>

//       <!-- Spacer (optional if you need to push the bottom row down) -->
//       <div style="
//         grid-column: 2 / 3;
//         grid-row: 2 / 3;
//       "></div>

//       <!-- Card number, full-width bottom row -->
//       <div style="
//         grid-column: 1 / 3;
//         grid-row: 3 / 4;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         font-size: 9pt;
//         margin-bottom: 2mm;
//       ">
//         ${identityCard.number}
//       </div>
//     </div>`;
// }
private buildCardFront({ worker, operation, farm, identityCard }: CardConfig): string {
  const first = worker.firstName || '—';
  const last  = worker.lastName  || '—';
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
      <!-- Avatar with CORS enabled -->
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

      <!-- Spacer -->
      <div style="
        grid-column: 2 / 3;
        grid-row: 2 / 3;
      "></div>

      <!-- Card number -->
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
  /** replace remote-URL buildCardBack with in-memory Data-URLs */
  private async buildCardBack(cfg: CardConfig): Promise<string> {
  // 1) Build the composite QR value directly off the worker
  const qrValue = [
    `card:${cfg.identityCard.number}`,
    `workerId:${cfg.worker.id}`,
    `farmId:${cfg.worker.farmId}`,
    `operationId:${cfg.worker.operationId}`
  ].join('');

  // 2) Generate QR data-URL
  const qrDataUrl = await QRCode.toDataURL(qrValue, {
    width: 150,
    margin: 0
  });

  // 3) Generate Code128 barcode data-URL
  const bcCanvas = document.createElement('canvas');
  JsBarcode(bcCanvas, cfg.identityCard.number, {
    format:       'CODE128',
    width:        2,
    height:       50,
    displayValue: false,
    margin:       0
  });
  const bcDataUrl = bcCanvas.toDataURL('image/png');

  // 4) Return HTML: QR on top, barcode + tiny card # beneath
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
      <!-- QR block -->
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

      <!-- Barcode + tiny card number -->
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
    </div>
  `;
}
}

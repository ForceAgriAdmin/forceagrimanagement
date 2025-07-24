// src/app/components/manage/report-management.component.ts
import {
  Component,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatCardModule
} from '@angular/material/card';
import {
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import {
  MatProgressSpinnerModule
} from '@angular/material/progress-spinner';
import {
  MatTooltipModule
} from '@angular/material/tooltip';
import {
  MatSort,
  MatSortModule
} from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorModule
} from '@angular/material/paginator';
import {
  MatTableDataSource,
  MatTableModule
} from '@angular/material/table';

import {
  MatIconModule
} from '@angular/material/icon';
import { ForceSearchComponent } from '../../../../components/general/force-search/force-search.component';
import { ForceButtonComponent } from '../../../../components/general/forcebutton/forcebutton.component';
import { AppReport } from '../../../../models/reports/appreport';
import { ReportsService } from '../../../../services/report.service';
import { AddReportComponent } from '../../../../dialogs/add-report/add-report.component';
import { RunReportComponent } from '../../../../dialogs/run-report/run-report.component';
import { HasRoleDirective } from '../../../../directives/has-role.directive';
import { NotificationService } from '../../../../services/notification.service';
import { AppGenericReport } from '../../../../models/reports/appgenericreport';
import { RunGenericReportComponent } from '../../../../dialogs/run-generic-report/run-generic-report.component';
@Component({
  selector: 'app-report-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ForceSearchComponent,
    ForceButtonComponent,
    MatIconModule,
    HasRoleDirective
  ],
  templateUrl: './report-management.component.html',
  styleUrls: ['./report-management.component.scss']
})
export class ReportManagementComponent implements OnInit {
  reports: AppGenericReport[] = [];
  filtered = new MatTableDataSource<AppGenericReport>([]);
  loading: boolean | undefined;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public svc: ReportsService,   // ← make public
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.svc.getGenericReports().subscribe(list => {
      this.reports = list;
      this.filtered.data = list;
      this.filtered.sort = this.sort;
      this.filtered.paginator = this.paginator;
    });
    this.loading = false;
  }

  onSearch(term: string) {
    const t = term.trim().toLowerCase();
    this.filtered.filterPredicate = (r, f) =>
      r.name.toLowerCase().includes(f) ||
      r.description.toLowerCase().includes(f);
    this.filtered.filter = t;
  }
  onClear() {
    this.filtered.filter = '';
  }

  onAddEdit(r?: AppGenericReport) {
    const ref = this.dialog.open(AddReportComponent, {
      width: '600px',
      data: r ?? null
    });
    ref.afterClosed().subscribe(changed => {
      if (!changed) return;
      this.notify.showSuccess('Report Edited Successfully');
    });
  }

  onRun(r: AppGenericReport) {
    this.dialog.open(RunGenericReportComponent, {
      width: '800px',
      data: r
    });
  }
}

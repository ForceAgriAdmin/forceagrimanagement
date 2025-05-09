import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Directive({
  standalone: true,
  selector: '[appHasRole]'
})
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input('appHasRole') required: string | string[] = [];
  private sub!: Subscription;

  constructor(
    private tpl: TemplateRef<any>,
    private vc: ViewContainerRef,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const needed = Array.isArray(this.required)
      ? this.required
      : [this.required];

    // assumes you have AuthService.currentUserRoles$ implemented
    this.sub = this.auth.currentUserRoles$.subscribe(userRoles => {
      const ok = needed.some(r => userRoles.includes(r));
      this.vc.clear();
      if (ok) {
        this.vc.createEmbeddedView(this.tpl);
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}

import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'Pulzivo Analytics';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    if (!routeTitle) {
      this.title.setTitle(APP_NAME);
    } else if (routeTitle.startsWith('Pulzivo')) {
      // Full title already set (e.g. home page) — use as-is
      this.title.setTitle(routeTitle);
    } else {
      this.title.setTitle(`${routeTitle} | ${APP_NAME}`);
    }
  }
}

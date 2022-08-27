import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import extendFileSystemAPI from "./app/fileSystemExtender";
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

extendFileSystemAPI();

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

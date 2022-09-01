import { Component, OnInit } from '@angular/core';
import { SettingsService } from "./settings.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AnnoMOD } from "./AnnoMOD";
import { ModManagerService } from "./mod-manager.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'Anno 1800 Mod-Manager ';
  state = 'entry';
  searchTerm: string = "";

  annoModRef = AnnoMOD;
  viewStyle: string[] = [];

  viewSlim = false;
  filterEnabledOnly: boolean | null = null;
  filterDlcReady: boolean | null = null;


  constructor(public settings: SettingsService, private _snackBar: MatSnackBar, private modManager: ModManagerService) {
    this.settings.onConnection.subscribe(() => {
      if (this.state != 'settings') this.state = 'home';
      console.info('Anno Files located!');
    });
  }

  ngOnInit() {

  }

  closeSettings() {
    if (this.settings.connected) {
      this.state = 'home';
    } else {
      this._snackBar.open("Please Select a Anno 1800 directory!", 'OK', {
        duration: 5000,
        politeness: "assertive",
      });
    }
  }

  load() {
    this.settings.load().then(() => {
      this.state = this.settings.connected ? 'home' : 'settings';
    }).catch((reason) => {
      this.state = 'error';
      console.error('load settings error', reason);
    });
  }

  refresh() {
    AnnoMOD.load().then(() => {
      this._snackBar.open("Anno Mods reloaded from file system", 'OK', {
        duration: 200,
        politeness: "polite",
      });
    }).catch((reason) => {
      this._snackBar.open("Unable to reload the file system. " + reason, 'OK', {
        duration: 5000,
        politeness: "assertive",
      });
    });
  }

  uploadedFile(files: FileList) {
    this.modManager.installMods(files).then().catch(console.error);
    console.info('files', files);
  }

  activeFilterChange() {
    if (this.filterEnabledOnly === null) {
      this.filterEnabledOnly = true;
    } else if (this.filterEnabledOnly) {
      this.filterEnabledOnly = false;
    } else {
      this.filterEnabledOnly = null;
    }
  }

  dlcFilterChange() {
    if (this.filterDlcReady === null) {
      this.filterDlcReady = true;
    } else if (this.filterDlcReady) {
      this.filterDlcReady = false;
    } else {
      this.filterDlcReady = null;
    }
  }
}

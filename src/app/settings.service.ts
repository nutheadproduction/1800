import { EventEmitter, Injectable } from '@angular/core';
import { get, set } from 'idb-keyval';
import { AnnoDLC } from "./AnnoDLC";
import { BehaviorSubject } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  get inSelection(): boolean {
    return this._inSelection;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  get userDLCs(): AnnoDLC[] {
    return [...this._userDLCs.values()];
  }

  get connected(): boolean {
    return this._fs_connect !== undefined;
  }

  private _fs_connect?: FileSystemDirectoryHandle;
  public readonly modsDir = new BehaviorSubject<FileSystemDirectoryHandle | null>(null);
  private _userDLCs = AnnoDLC.map();

  private _loaded = false;

  private _inSelection = false;

  public readonly onConnection = new EventEmitter<void>();

  constructor(private _snackBar: MatSnackBar) {
    (window as any).currentSettings = this;
  }

  set_FS_connect(dirHandle: FileSystemDirectoryHandle): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if (await dirHandle.queryPermission({ mode: "readwrite" }) !== 'granted') {
          this._inSelection = true;
          if (await dirHandle.requestPermission({ mode: "readwrite" }) !== 'granted') {
            this._inSelection = false;
            return reject('permissions not granted');
          }
          this._inSelection = false;
        }

        const checklist = ["accounts", "config", "GameSettings"];
        let isMods = false;
        let checked = 0;

        for await (const [key, value] of dirHandle.entries()) {
          checked += (checklist.indexOf(key) !== -1) ? 1 : 0;
          isMods = isMods || key.toLowerCase() === "mods";
        }


        if (checked < checklist.length) {
          return reject("Not a Anno 1800 documents directory");
        }

        this._fs_connect = dirHandle;
        await this.save();

        const modsDir = await dirHandle.getDirectoryHandle('mods', { create: true });
        this.modsDir.next(modsDir);

        this.onConnection.emit();
        console.info('connected', this.modsDir);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  load() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const data = await get<Partial<SettingsServiceSaveableObject>>('app_settings');
        this._loaded = true;
        if (data === undefined) return resolve();

        //reset & marks selected DLCs
        this._userDLCs.forEach((value, key) => { value.isActive = false; });
        for (const dlc of data?._userDLCs || []) {
          const item = this._userDLCs.get(dlc.id);
          if (item) item.isActive = dlc.active;
        }

        if (data?._fs_connect) {
          this._fs_connect = undefined;
          this.modsDir.next(null);
          this.set_FS_connect(data._fs_connect).catch((err) => {
            console.error('while loading _fs_connect', err);
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  save() {
    return set('app_settings', this.toObject()).then(() => {
      console.info("app settings saved");
    }).catch(console.error);
  }

  private toObject(): SettingsServiceSaveableObject {
    return {
      _profiles: [],
      _profile: '',
      _fs_connect: this._fs_connect,
      _userDLCs: [...this._userDLCs.values()]
        .map<{ id: number, active: boolean }>((dlc) => {
          return {
            id: dlc.id,
            active: dlc.isActive
          }
        })
    }
  }

  public toast(message: string, action?: string) {
    this._snackBar.open(message, action, { duration: 3000 });
  }

  public selectFolder() {
    this._fs_connect = undefined;
    this._inSelection = true;
    showDirectoryPicker({
      // id: "annoFolder",
      mode: "readwrite",
      startIn: "documents"
    }).then((handle) => {
      this.set_FS_connect(handle).then(() => {
        this.toast("Anno Documents folder set");
        this._inSelection = false;
      }).catch((e) => {
        this.toast('Error while selecting the folder: ' + e);
        this._inSelection = false;
      });
    });
  }


}


interface SettingsServiceSaveableObject {
  _fs_connect?: FileSystemDirectoryHandle,
  _userDLCs: { id: number, active: boolean }[],
  _profiles: Profile[],
  _profile: string //guid of the currently selected profile
}

export interface Profile {
  guid: string,
  name: string,
  activeMods: string[]
}

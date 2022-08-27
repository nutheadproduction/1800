import { Injectable } from '@angular/core';
import { SettingsService } from "./settings.service";
import { AnnoMOD } from "./AnnoMOD";
import { readUploadedFile } from "./helper";
import JSZip from "jszip";
import * as stream from "stream";

@Injectable({
  providedIn: 'root'
})
export class ModManagerService {

  mods = AnnoMOD.repo;

  constructor(private settings: SettingsService) {
    AnnoMOD.init(this.settings);
  }

  installMods(files: FileList): Promise<AnnoMOD[]> {
    return new Promise<AnnoMOD[]>(async (resolve, reject) => {

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type == 'application/x-zip-compressed') {
          await this.installZipMod(file).catch((reason) => {
            console.error('could not install ', file.name, reason);
          });
        }

      }
      resolve([]);
    });
  }

  private installZipMod(file: File): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        console.info("try to read", file.name);
        const zipBuffer = await readUploadedFile.asArrayBuffer(file);
        const new_zip = new JSZip();
        const zipData = await new_zip.loadAsync(zipBuffer)

        for (const zipItemName in zipData.files) {
          const zipItem = zipData.files[zipItemName];
          if (!zipItem.dir && zipItemName.match(/\/modinfo\.json$/gi)) {
            const modInfo = AnnoMOD.annoModInfo(await zipItem.async("string"));
            if (!modInfo) throw "ModInfo invalid";
            let zipDir = zipItemName.substring(0, zipItemName.length - '/modinfo.json'.length);

            const modDir = zipDir.split('/').pop();
            zipDir += '/'

            console.info("modinfo found", modDir, zipDir, zipItemName);
            const mod = await AnnoMOD.loadFromAnnoModInfo(modInfo, modDir);
            console.info("mod created?", mod);
            mod.locked.next(true);

            for (const zipModItemName in zipData.files) {
              const zipModItem = zipData.files[zipModItemName];
              if (!zipModItem.dir && zipModItemName.indexOf(zipDir) === 0) {
                console.info(zipModItemName);
                const relName = zipModItemName.substring(zipDir.length);
                const modFile = await mod.getFile(relName);
                const modFileWriter = await modFile.createWritable();
                const buffer = await zipModItem.async("blob");

                await modFileWriter.write(buffer)
                await modFileWriter.close();
                console.log(relName, 'written');
              }
            }

            mod.locked.next(false);
          }
        }

        console.info(zipData.files);
      } catch (e) {
        console.error(e);
      }
    });
  }

  isMod() {

  }

}

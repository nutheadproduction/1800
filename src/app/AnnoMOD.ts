import { SettingsService } from "./settings.service";
import { BehaviorSubject } from "rxjs";
import { readUploadedFile } from "./helper";
import { AnnoDLC } from "./AnnoDLC";
import { AnnoDLC_list } from "./AnnoDLC.list";


export namespace AnnoModConfig {

  export interface ModInfo {
    Version: VersionNumber, //e.g. "1.0.0",
    ModID: ModID,
    Category: i18n,
    ModName: i18n,
    Description: i18n,
    IncompatibleIds?: null | ModID[],
    ModDependencies?: null | ModID[],
    DLCDependencies?: null | DLCDependency[],
    KnownIssues?: null | i18n[],
    CreatorName?: null | string,
    CreatorContact?: null | string,
    Image?: null | string, //Base64 image

    //New additional fields:

    Tags?: null | string[],
    Origin?: string, //url where to download this mod
    PackageID?: string, //a package ID
    PackageName?: null | i18n[], //a package ID
    Generated?: boolean //is it a mod-manager generated one
  }

  export type VersionNumber =
    'unknown' |
    `${bigint}.${bigint}.${bigint}` |
    `${bigint}.${bigint}` |
    `${bigint}`;

  export type ModID = string;

  // export type DLCid =
  //   "Anarchist" |
  //   "SunkenTreasures" |
  //   "Botanica" |
  //   "ThePassage" |
  //   "SeatOfPower" |
  //   "BrightHarvest" |
  //   "LandOfLions" |
  //   "Docklands" |
  //   "Tourism" |
  //   "Highlife" |
  //   "SeedsOfChange" |
  //   "EmpireOfTheSkies" |
  //   "NewWorldRising" |
  //   //cosmetics
  //   "Christmas" |
  //   "AmusementPark" |
  //   "CityLife" |
  //   "VehicleSkins" |
  //   "VibrantCity" |
  //   "PedestrianZone" |
  //   "SeasonalDecorations" |
  //   "IndustryOrnaments";

  export interface DLCDependency {
    "DLC": AnnoDLC_list,
    "Dependant": DLCDependencyType
  }

  export interface DLCDependencyLinked {
    "DLC": AnnoDLC,
    "Dependant": DLCDependencyType
  }

  export type DLCDependencyType = "required" | "partly" | "atLeastOneRequired";

  export interface i18n {
    English: string,
    Chinese?: null | string,
    French?: null | string,
    German?: null | string,
    Italian?: null | string,
    Korean?: null | string,
    Polish?: null | string,
    Russian?: null | string,
    Spanish?: null | string,
    Taiwanese?: null | string
  }


  export type i18nLng = keyof i18n;

  export const lngs: string[] = ["English", "Chinese", "French", "German", "Italian", "Korean", "Polish", "Russian", "Spanish", "Taiwanese"];
  // "English" |
  // "Chinese" |
  // "French" |
  // "German" |
  // "Italian" |
  // "Korean" |
  // "Polish" |
  // "Russian" |
  // "Spanish" |
  // "Taiwanese";
}

export class AnnoMOD {


  private static settings: SettingsService
  private static initialized = false;

  public static readonly lngs: string[] = AnnoModConfig.lngs;

  public static lng: keyof AnnoModConfig.i18n = "English";
  public static lngFB: keyof AnnoModConfig.i18n = "English";
  public static ignoreDir = [".cache"];

  public static readonly repo = new Map<string, AnnoMOD>();

  public static updateAll() {
    for (const [id, mod] of this.repo) {
      mod.update();
    }
  }

  //region Static stuff
  static i18nString(text: AnnoModConfig.i18n): string {
    if (this.lng in text && text[this.lng])
      return text[this.lng] + '';
    if (this.lngFB in text && text[this.lngFB])
      return text[this.lngFB] + '';
    return text.English;
  }

  private static reset() {
    this.repo.clear();
  }

  static async load() {
    try {
      // this.reset();
      const modsDir = this.settings.modsDir.getValue();
      if (modsDir === null) return;

      const allProm: Promise<AnnoModConfig.ModInfo>[] = [];

      for await (const [name, handle] of modsDir.entries()) {
        if (handle.kind == "directory" && name.substring(0, 1) !== '.' && this.ignoreDir.indexOf(name) === -1) {
          // console.info("Mod import ", name);
          allProm.push(this.loadFromAnnoModFS(handle));
        }
      }

      const modIDs = (await Promise.all(allProm)).map(value => value.ModID);
      //remove non-existing mods
      for (const key of this.repo.keys()) {
        if (modIDs.indexOf(key) === -1) {
          console.warn('mod removed', key);
          this.repo.delete(key);
        }
      }

    } catch (e) {
      console.error(e);
    }
  }


  static annoModInfo(jsonString: string): AnnoModConfig.ModInfo | null {
    try {
      const matches = jsonString.matchAll(/("(?:[^"\\]|(\\\\)|(?:\\\\)*\\.)*")/gm);
      for (const match of matches) {
        const nText = match[0].replace("\n", "\\n").replace('\r', '');
        jsonString.replace(match[0], nText);
      }
      return (JSON.parse(jsonString) as AnnoModConfig.ModInfo);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  static loadFromAnnoModInfo(data: AnnoModConfig.ModInfo, folderName?: string): Promise<AnnoMOD> {
    return new Promise<AnnoMOD>(async (resolve, reject) => {
      try {
        const now = Math.ceil(Date.now() / 1000);
        folderName = (folderName || data.ModID + "_" + now) + '';
        const modsDir = this.settings.modsDir.getValue();
        if (!modsDir) throw "modsDir unknown";
        let mod = this.repo.get(data.ModID);
        if (!mod) {
          for await (const [name, entry] of modsDir.entries()) {
            if (name === folderName) {
              throw "Folder already exists " + folderName;
            }
          }
          console.info('try to create mod folder', folderName);
          const dirHandle = await modsDir.getDirectoryHandle(folderName, { create: true });
          console.info('create AnnoMod item', dirHandle);
          mod = new this(data.ModID, dirHandle);
          console.info('mod exists', mod);
        }
        mod.ingest(data);
        resolve(mod);
      } catch (e) {
        reject(e);
      }
    });
  }

  static buildModInfoByName(modName: string): AnnoModConfig.ModInfo {
    const cat = modName.match(/\[[^\]]*\]/ig)?.join(" ").replace('[', '').replace(']', '').trim() || '';
    const name = modName.replace(/\[[^\]]*\]/ig, '').trim();
    const id = name.match(/[A-Za-z0-9\s-_.]*/ig)?.join('').replace(' ', '_') || Date.now() + '';

    return {
      ModID: id,
      Version: 'unknown', //e.g. "1.0.0",
      Category: { English: cat },
      ModName: { English: name },
      Description: { English: 'autogenerated ModInfo' },
      Generated: true
    }
  }

  static loadFromAnnoModFS(dirHandle: FileSystemDirectoryHandle, update: boolean = true): Promise<AnnoModConfig.ModInfo> {
    return new Promise(async (resolve, reject) => {

      dirHandle.getFileHandle('modinfo.json', { create: true }).then(async (fileHandle) => {
        try {
          const fileData = await fileHandle.getFile();
          const fileContent = await fileData.text();
          let data: AnnoModConfig.ModInfo | null;
          if (!fileContent) {
            const modInfoWriter = await fileHandle.createWritable();
            data = this.buildModInfoByName(dirHandle.name);
            await modInfoWriter.write(JSON.stringify(data));
            await modInfoWriter.close();
          } else {
            data = this.annoModInfo(fileContent);
          }

          if (!data) throw "invalid json data";

          if (update) {
            let mod = this.repo.get(data.ModID) || new this(data.ModID, dirHandle);
            mod._handle = dirHandle;
            mod.ingest(data);
          }
          resolve(data);
        } catch (e) {
          reject(e);
        }
      }).catch((e: DOMException) => {
        console.error(dirHandle.name, e.name);
        reject(e);
      });
    })
  }

  static init(settings: SettingsService) {
    if (this.initialized) return;
    this.initialized = true;
    this.settings = settings;
    this.settings.modsDir.subscribe(this.load.bind(this));
  }

  //endregion

  //region Getter & Setter
  get creatorName(): string {
    return this._creatorName;
  }

  get knownIssues(): string[] {
    return this._knownIssues.map(this.self.i18nString)
  }

  get dlcDependencies(): AnnoModConfig.DLCDependency[] {
    return this._dlcDependencies;
  }

  get modDependencies(): AnnoModConfig.ModID[] {
    return this._modDependencies;
  }

  get incompatibleIds(): AnnoModConfig.ModID[] {
    return this._incompatibleIds;
  }

  get description(): string {
    return this.self.i18nString(this._description);
  }

  get name(): string {
    return this.self.i18nString(this._modName);
  }

  get title(): string {
    return this.name;
  }

  get category(): string {
    return this.self.i18nString(this._category);
  }

  get modID(): AnnoModConfig.ModID {
    return this._modID;
  }

  get id(): AnnoModConfig.ModID {
    return this._modID;
  }

  get version(): AnnoModConfig.VersionNumber {
    return this._version;
  }

  get creatorContact(): string {
    return this._creatorContact;
  }

  get image(): string {
    if (this._image) return this._image;
    if (this._imgFallback) return this._imgFallback;
    // if()
    return "assets/bg.jpg";
  }

  get origin(): string {
    return this._origin;
  }

  get tags(): string[] {
    return this._tags.map(value => value.toLowerCase());
  }


  get folder_name(): string {
    return this._handle.name.replace(/^-/g, '').trim();
  }

  get enabled(): boolean {
    return !this.disabled
  }

  set enabled(val: boolean) {
    if (val == this.enabled) return; //no changes made
    if (!this.usable && !this.enabled) return;
    if (this.locked.getValue()) return; //no not change if locked
    const modsDir = this.self.settings.modsDir.getValue();
    if (modsDir === null) return; //no modsDir => just in case
    this.locked.next(true);
    const me = this;
    (async () => {
      try {
        const curDir = this._handle.name;
        const newDir = (val ? '' : '-') + this.folder_name;
        if (newDir !== curDir) { //make sure just in case...
          const newDirHandle = await modsDir.getDirectoryHandle(newDir, { create: true });
          await this._handle.copy(newDirHandle); //copy current stuff to newDirHandle
          await modsDir.removeEntry(curDir, { recursive: true });
          this._handle = newDirHandle;
          me.locked.next(false);
        }
      } catch (e) {
        console.error(e);
        me.locked.next(false);
      }
    })();


  }

  get disabled(): boolean {
    return this._handle.name.match(/^-/g) !== null
  }

  set disabled(val: boolean) {
    this.enabled = !val;
  }

  get generated(): boolean {
    return this._generated;
  }

  set generated(value: boolean) {
    this._generated = value;
  }


  get DLCs(): AnnoDLC[] {
    return this._DLCs;
  }

  get DLCs_leastOne(): AnnoDLC[] {
    return this._DLCs_leastOne;
  }

  get DLCs_leastOneNeeded(): AnnoDLC[] {
    return this.DLCs_leastOne.filter(dlc => !dlc.isActive)
  }

  get DLCs_required(): AnnoDLC[] {
    return this._DLCs_required;
  }

  get DLCs_requiredNeeded(): AnnoDLC[] {
    return this.DLCs_required.filter(dlc => !dlc.isActive)
  }


  get DLCs_optional(): AnnoDLC[] {
    return this._DLCs_optional;
  }

  get MODs_incompatible(): AnnoMOD[] {
    return [...this.self.repo.values()].filter(mod => this._incompatibleIds.includes(mod.modID));
  }

  get MODs_required(): AnnoMOD[] {
    return [...this.self.repo.values()].filter(mod => this._modDependencies.includes(mod.modID));
  }


  get changeable(): boolean {
    if (this.locked.getValue()) return false;
    if (!this.usable) return false;
    return true;
  }

  get usable(): boolean {
    if (this.DLCs_requiredNeeded.length > 0) return false; //match all
    if (this.DLCs_leastOneNeeded.length > 0) return false; //at least one

    if (this.MODs_incompatible.filter(mod => mod.enabled).length)
      return false; //if any incompatible mod is enabled
    if (this.MODs_required.filter(mod => !mod.enabled).length)
      return false; //if any required mod is disabled

    return true;
  }

  //endregion

  private _DLCs: AnnoDLC[] = [];
  private _DLCs_required: AnnoDLC[] = [];
  private _DLCs_optional: AnnoDLC[] = [];
  private _DLCs_leastOne: AnnoDLC[] = [];

  public readonly locked = new BehaviorSubject<boolean>(false);
  private _folder_name: string;

  private _version: AnnoModConfig.VersionNumber = "0.0.0"; //e.g. "1.0.0",
  private _modID: AnnoModConfig.ModID = 'modID';
  private _category: AnnoModConfig.i18n = { English: 'Mod Category' };
  private _modName: AnnoModConfig.i18n = { English: 'Mod Name' };
  private _description: AnnoModConfig.i18n = { English: 'Mod Description' };
  private _incompatibleIds: AnnoModConfig.ModID[] = [];
  private _modDependencies: AnnoModConfig.ModID[] = [];
  private _dlcDependencies: AnnoModConfig.DLCDependency[] = [];
  private _knownIssues: AnnoModConfig.i18n[] = [];
  private _creatorName: string = '';
  private _creatorContact: string = '';
  private _image: string = ''; //Base64 image
  private _imgFallback: string = '';//internal fallback img


  //New additional fields:

  private _tags: string[] = [];
  private _origin: string = ''; //url where to download this mod
  private _generated: boolean = false;


  public self = AnnoMOD;

  constructor(private _id: string, private _handle: FileSystemDirectoryHandle) {
    this._folder_name = _handle.name;
    this.self.repo.set(_id, this);
  }

  public ingest(data: AnnoModConfig.ModInfo) {
    this._version = data.Version;
    this._modID = data.ModID;
    this._category = data.Category;
    this._modName = data.ModName;
    this._description = data.Description;
    this._incompatibleIds = data.IncompatibleIds || this._incompatibleIds;
    this._modDependencies = data.ModDependencies || this._modDependencies;
    this._dlcDependencies = data.DLCDependencies || this._dlcDependencies;
    this._knownIssues = data.KnownIssues || this._knownIssues;
    this._creatorName = data.CreatorName || this._creatorName;
    this._creatorContact = data.CreatorContact || this._creatorContact;
    this._image = data.Image || this._image;
    this._generated = data.Generated === true;

    this._tags = data.Tags || this._tags;
    this._origin = data.Origin || this._origin;
    this.update();
  }

  public getFile(filename: string): Promise<FileSystemFileHandle> {
    return new Promise<FileSystemFileHandle>(async (resolve, reject) => {
      try {
        filename = filename.replace('\\', '/');
        let dir = filename.split('/');
        filename = dir.pop() + '';
        let dirHandle = this._handle;
        for (const d of dir) {
          if (d && d !== '..')
            dirHandle = await dirHandle.getDirectoryHandle(d, { create: true });
        }
        resolve(await dirHandle.getFileHandle(filename, { create: true }));
      } catch (e) {
        reject(e);
      }
    });

  }

  public uninstall(): Promise<void> {
    this.locked.next(true);
    return new Promise<void>(async (resolve, reject) => {
      try {
        const moddir = this.self.settings.modsDir.getValue()
        if (!moddir) throw "moddir not ready";
        await moddir.removeEntry(this._handle.name, { recursive: true });
        this.self.repo.delete(this.id);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  public searchScore(term: string | string[]): number {
    term = typeof (term) === "string" ? term.split(' ') : term;
    let score = 0;
    term = term.filter(value => value !== '');
    if (term.length == 0) return score;
    if (term.length > 1) {
      for (const singleTerm of term) {
        const nScore = this.searchScore(singleTerm);
        if (!nScore) return 0;
        score += nScore;
      }
      return score
    }


    const sTerm = term[0].toLowerCase();


    score += this.id.toLowerCase() == sTerm ? 100 : 0;
    score += this.id.toLowerCase().indexOf(sTerm) !== -1 ? 2 : 0;

    score += this.tags.indexOf(sTerm) !== -1 ? 4 : 0;
    score += this.category.toLowerCase().indexOf(sTerm) === 0 ? 5 : 0;
    score += ('[' + this.category.toLowerCase()).indexOf(sTerm) === 0 ? 5 : 0;
    score += this.name.toLowerCase().indexOf(sTerm) !== -1 ? 3 : 0;
    score += this.description.toLowerCase().indexOf(sTerm) !== -1 ? 1 : 0;

    return score;
  }

  // private loadFromModInfoJSON(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //
  //   })
  // }
  public update() {
    if (!this._image && !this._imgFallback) {
      setTimeout(async () => {
        for await (const [name, handle] of this._handle.entries()) {
          if (this._imgFallback) break;
          if (handle.kind == "directory") continue;
          if (!name.match(/\.(jpe?g|png|gif)$/i)) continue;
          const file = await handle.getFile();
          this._imgFallback = await readUploadedFile.asDataURL(file);
        }
      }, 500);
    }

    this._DLCs = this._dlcDependencies.map((dep) => {
      return AnnoDLC.get(dep.DLC)
        || new AnnoDLC(Math.max(500, AnnoDLC.largestID() + 1), dep.DLC + '')
    });


    this._DLCs_leastOne = this._dlcDependencies
      .filter(dep => dep.Dependant === "atLeastOneRequired")
      .map(dep => AnnoDLC.getOrUnknown(dep.DLC));

    this._DLCs_required = this._dlcDependencies
      .filter(dep => dep.Dependant === "required")
      .map(dep => AnnoDLC.getOrUnknown(dep.DLC));

    this._DLCs_optional = this._dlcDependencies
      .filter(dep => dep.Dependant === "partly")
      .map(dep => AnnoDLC.getOrUnknown(dep.DLC));


  }
}


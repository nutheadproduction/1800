import { SettingsService } from "./settings.service";
import { BehaviorSubject } from "rxjs";
import { readUploadedFile } from "./helper";


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
  }

  export type VersionNumber =
    `${bigint}.${bigint}.${bigint}` |
    `${bigint}.${bigint}` |
    `${bigint}`;

  export type ModID = string;

  export type DLCid =
    "Anarchist" |
    "SunkenTreasures" |
    "Botanica" |
    "ThePassage" |
    "SeatOfPower" |
    "BrightHarvest" |
    "LandOfLions" |
    "Docklands" |
    "Tourism" |
    "Highlife" |
    "SeedsOfChange" |
    "EmpireOfTheSkies" |
    "NewWorldRising" |
    //cosmetics
    "Christmas" |
    "AmusementPark" |
    "CityLife" |
    "VehicleSkins" |
    "VibrantCity" |
    "PedestrianZone" |
    "SeasonalDecorations" |
    "IndustryOrnaments";

  export interface DLCDependency {
    "DLC": DLCid,
    "Dependant": "required" | "partly" | "atLeastOneRequired"
  }

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
    return "assets/bg.png";
  }

  get origin(): string {
    return this._origin;
  }

  get tags(): string[] {
    return this._tags.map(value => value.toLowerCase());
  }


  private static settings: SettingsService
  private static initialized = false;

  public static readonly lngs: string[] = AnnoModConfig.lngs;

  public static lng: keyof AnnoModConfig.i18n = "English";
  public static lngFB: keyof AnnoModConfig.i18n = "English";
  public static ignoreDir = [".cache"];

  public static readonly repo = new Map<string, AnnoMOD>();

  public self = AnnoMOD;

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
      console.info('modIDs', modIDs);
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

  static loadFromAnnoModFS(dirHandle: FileSystemDirectoryHandle, update: boolean = true): Promise<AnnoModConfig.ModInfo> {
    return new Promise((resolve, reject) => {
      dirHandle.getFileHandle('modinfo.json').then(async (fileHandle) => {
        try {
          console.info('file', fileHandle.name);
          const fileData = await fileHandle.getFile();
          const fileContent = await fileData.text();

          const data = this.annoModInfo(fileContent);
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


  get folder_name(): string {
    return this._handle.name.replace(/^-/g, '').trim();
  }

  get enabled(): boolean {
    return !this.disabled
  }

  set enabled(val: boolean) {
    if (val == this.enabled) return; //no changes made
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

  public readonly locked = new BehaviorSubject<boolean>(true);
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

  constructor(private _id: string, private _handle: FileSystemDirectoryHandle) {
    this._folder_name = _handle.name;
    this.self.repo.set(_id, this);
    //Todo: this.self.repo.set()
    this.locked.asObservable().subscribe(async (value) => {
      await this.loadFallbackImg();
    });
    this.locked.next(false);
  }

  public loadFallbackImg() {
    if (this._image) return;
    this._imgFallback = '';
    setTimeout(async () => {
      for await (const [name, handle] of this._handle.entries()) {
        console.info('imgtest', name);
        if (this._imgFallback) break;
        if (handle.kind == "directory") continue;
        if (!name.match(/\.(jpe?g|png|gif)$/i)) continue;
        const file = await handle.getFile();
        console.info('IMAGE file', file);
        this._imgFallback = await readUploadedFile.asDataURL(file);
        console.info('image', this._imgFallback);
      }
    }, 500);
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

    this._tags = data.Tags || this._tags;
    this._origin = data.Origin || this._origin;
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

    console.info(this.name, score, sTerm);

    return score;
  }

  // private loadFromModInfoJSON(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //
  //   })
  // }
}


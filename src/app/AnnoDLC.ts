import DLCs from "../assets/DLCs.json";
import { AnnoDLC_type, AnnoDLC_list } from "./AnnoDLC.list";


export class AnnoDLC {


  private static readonly _repo: Map<number, AnnoDLC> = new Map<number, AnnoDLC>();

  static list(): AnnoDLC[] {
    return [...this._repo.values()];
  }

  static map(): Map<number, AnnoDLC> {
    return this._repo;
  }

  static largestID(): number {
    return Math.max(...this._repo.keys());
  }

  static get(dlcIdent: AnnoDLC_list): AnnoDLC | null {
    return this.byName(dlcIdent);
  }

  static getOrUnknown(dlcIdent: AnnoDLC_list): AnnoDLC {
    return this.get(dlcIdent) || new this(Math.max(500, this.largestID() + 1), dlcIdent + '', 'unknown');
  }

  static byID(id: number): AnnoDLC | null {
    return this._repo.get(id) || null;
  }

  static byName(name: AnnoDLC_list | string): AnnoDLC | null {
    name = (name + '').toLowerCase();
    for (const [id, dlc] of this._repo) {
      if (dlc.name.toLowerCase() === name || id + '' == name)
        return dlc;
    }
    return null;
  }

  private static _initialized = false;

  static init() {
    if (this._initialized) return;
    this._initialized = true;
    //load all DLCs
    this._repo.clear();

    for (const key in AnnoDLC_list) {
      const id = parseInt(key);
      if (!isNaN(id)) {
        const name = AnnoDLC_list[id];
        new this(id, name, id < 200 ? 'content' : (id < 500 ? 'cosmetic' : 'unknown'));
      }
    }

    // for (const dlc of DLCs.dlc) {
    //   new this(dlc.id, dlc.name, (dlc.type as any));
    // }
  }

  get isActive(): boolean {
    return this._isActive;
  }


  set isActive(value: boolean) {
    this._isActive = value;
  }


  get name(): string {
    return this._name;
  }

  get title():string{
    return this.name.replace(/([A-Z])/g,  " $&").trim();
  }

  get id(): number {
    return this._id;
  }

  get type(): AnnoDLC_type {
    return this._type;
  }

  private self = AnnoDLC;
  private _isActive: boolean = false;


  constructor(private _id: number, private _name: string = '', private _type: AnnoDLC_type = "unknown") {
    this.self._repo.set(this._id, this);
  }


}

AnnoDLC.init();


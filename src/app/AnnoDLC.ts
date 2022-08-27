import DLCs from "../assets/DLCs.json";
import { AnnoDLC_type } from "./AnnoDLC.list";



export class AnnoDLC {


  private static readonly _repo: Map<number, AnnoDLC> = new Map<number, AnnoDLC>();

  static list(): AnnoDLC[] {
    return [...this._repo.values()];
  }

  static map(): Map<number, AnnoDLC> {
    return this._repo;
  }


  private static _initialized = false;

  static init() {
    if (this._initialized) return;
    this._initialized = true;
    //load all DLCs
    this._repo.clear();
    for (const dlc of DLCs.dlc) {
      new this(dlc.id, dlc.name, (dlc.type as any));
    }
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

  get id(): number {
    return this._id;
  }

  get type(): AnnoDLC_type {
    return this._type;
  }

  private self = AnnoDLC;
  private _isActive: boolean = false;


  constructor(private _id: number = 0, private _name: string = '', private _type: AnnoDLC_type = "unknown") {
    this.self._repo.set(this._id, this);
  }


}

AnnoDLC.init();


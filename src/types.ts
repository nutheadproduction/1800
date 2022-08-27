import { AnnoDLC } from "./app/AnnoDLC";

export interface AppSettings {
  dlc: AnnoDLC[],
}

// export function normalizeAnnoDLC(name: string | number): number {
//   if (typeof (name) == 'number') return name in AnnoDLC ? name : 0;
//
//   name = name.replace(" ", '').toLowerCase();
//   for (const id in AnnoDLC) {
//     if (AnnoDLC[id].replace(" ", '').toLowerCase() === name) {
//       return parseInt(id + '');
//     }
//   }
//   return 0;
// }

import { Component, Input, OnInit } from '@angular/core';
import { ModManagerService } from "../mod-manager.service";
import { AnnoMOD } from "../AnnoMOD";

@Component({
  selector: 'app-mod-list',
  templateUrl: './mod-list.component.html',
  styleUrls: ['./mod-list.component.sass']
})
export class ModListComponent implements OnInit {

  constructor(public modService: ModManagerService) { }

  @Input() searchTerm: string = '';

  ngOnInit(): void {
  }

  sortedMods(): AnnoMOD[] {
    let mods = [...this.modService.mods.values()].sort((a, b) => {return a.folder_name > b.folder_name ? 1 : -1});
    // let ret: AnnoMOD[] = [];
    if (!this.searchTerm) return mods;

    let scoreSum = 0;

    let scores = mods
      .map((mod) => {
        const score = mod.searchScore(this.searchTerm);
        scoreSum += scoreSum;
        console.info(mod.name, score);
        return { score: score, mod: mod }
      });

    console.info(scoreSum);

    return scores
      .filter(value => {return value.score > 0})
      .sort((a, b) => b.score - a.score)
      .map(value => value.mod)
      ;


    // return mods.filter((mod) => {
    //   // mod.name.indexOf()
    // });
  }

}

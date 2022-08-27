import { Component, Input, OnInit } from '@angular/core';
import { AnnoMOD } from "../AnnoMOD";

@Component({
  selector: 'app-mod-list-item',
  templateUrl: './mod-list-item.component.html',
  styleUrls: ['./mod-list-item.component.sass'],
  host: {
    "[class.active]": "active"
  }
})
export class ModListItemComponent implements OnInit {

  @Input() width: number = 30;
  @Input() mod?: AnnoMOD;
  active: boolean = false;


  constructor() { }

  ngOnInit(): void {
  }

  activeToggle() {
    this.active = !this.active;
  }

}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SettingsService } from "../settings.service";
import { AnnoDLC } from "../AnnoDLC";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {

  constructor(public settings: SettingsService, private _snackBar: MatSnackBar) { }

  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  ngOnInit(): void {
    console.info(this.settings);
  }

  contentDLCs(): AnnoDLC[] {
    if (!this.settings) return [];
    return this.settings.userDLCs.filter((item) => item.type == "content");
  }

  cosmeticDLCs(): AnnoDLC[] {
    if (!this.settings) return [];
    return this.settings.userDLCs.filter((item) => item.type == "cosmetic");
  }


}

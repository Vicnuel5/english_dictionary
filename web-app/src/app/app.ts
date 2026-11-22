import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Notifications } from './core/components/notifications/notifications';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Notifications],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Lol } from './components/lol/lol';
import { User } from './components/user/user';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Lol, User],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'MessagingFront';
}

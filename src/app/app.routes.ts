import { Routes } from '@angular/router';
import { Login } from './component/login/login';
import { App } from './app';
import { loginGuard } from './services/login-guard';
import { Chats } from './component/chats/chats';

export const routes: Routes = [
    {
        path:"login",
        component:Login
    },
    {
        path:"",
        component:App,
        canActivate:[loginGuard]
    },
    {
        path:"chats",
        component:Chats,
        canActivate:[loginGuard]
    }
];

import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, timer } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Chat, Chats, NewChat } from '../component/chats/chats';
import { AuthService, LoginForm } from './auth-service';



export const apiURL:string = "https://flunkymessagingapp.onrender.com/api";

export interface Message{
  senderUsername: string,
  timestamp: Date,
  messageText: string,
  isRead: boolean
}

@Injectable({
  providedIn: 'root'
})

export class WebService {
  authSvc = inject(AuthService);
  http = inject(HttpClient);
  skipMessagesAmount : number = 0;
  
  getUserChatList() : Observable<Chat[]>{
    return this.http.get<Chat[]>(apiURL.concat("/chats/myChats"), { headers:this.headerConstruct() }).pipe(
      map( (i:Chat[]) => i),
      catchError(e => {console.log("eraa ga hassei"); return of([]);})
    );
  }

  newChatCreate(ncDTO: NewChat) {
    return this.http.post(apiURL + '/chats/newChat', ncDTO, {
      headers:this.headerConstruct(),
      observe: 'response'
    }).pipe(
      catchError(err => of(err)) // ensures you always get a response-like object
    );
  }

  addMembersToChat(id:number, members:string[]){
    return this.http.post(apiURL+'/chats/newMember', {ChatID: id, Members:members}, {headers:this.headerConstruct()}).pipe();
  }


  chatDelete(id:number) {
    return this.http.delete(apiURL + '/chats', {
      body: {id:id},
      headers:this.headerConstruct(),
      observe: 'response'
    }).pipe(catchError(err => of(err))
    );
  }

  newUserCreate(creds:LoginForm){
    return this.http.post(apiURL.concat('/auth/register'), creds, {observe: 'response'}).pipe(
      map((response)=>{
        console.log(response.status);
        return response.status;
      })
    );
  }

  headerConstruct(){
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authSvc.accessToken
    });
  }

  getLatestMessages(chatid:number, unreadNotRead:string, polling:boolean) : Observable<Message[]>{

    return this.http.get<Message[]>(apiURL+"/chats/readChatMsgs", {headers:this.headerConstruct(), 
      params:{
        chatid:chatid,
        last:10, 
        skip:this.skipMessagesAmount,
        unreadNotRead:unreadNotRead,
        polling:polling
        }});
  }

  sendMessage(message:string, chatid:number){
    return this.http.post<HttpErrorResponse>(apiURL+'/chats/sendMsgToChat', {chatID:chatid, message:message}, {observe:'response',headers:this.headerConstruct()})
    .pipe(catchError(res => of(res)));
  }

  receiveChatMembers(chatid:number){
    return this.http.get<string[]>(apiURL+'/chats/memberList', {params:{
      chatID:chatid
    }, headers:this.headerConstruct(),
      observe:'response'}).pipe( map(res=>res) );
  }
}

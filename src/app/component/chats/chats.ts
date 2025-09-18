import { ChangeDetectionStrategy, ChangeDetectorRef, Component, numberAttribute, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message, WebService } from '../../services/web-service';
import { Subject, switchMap, takeUntil, timer } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { HttpBackend, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { NgStyle } from '@angular/common';

export interface Chat{
  id : number,
  name : string
}

export interface NewChat{
  name: string,
  members: []
}
@Component({
  selector: 'app-chats',
  imports: [FormsModule, NgStyle],
  templateUrl: './chats.html',
  styleUrl: './chats.css',
})
export class Chats {
  criticalError:boolean=false;
  selectedChat:number|null=null;
  selectedChatName:string="";
  chats: Chat[] = [];
  loading : boolean = true;
  newChat:boolean=false;
  newChatName:string="";
  newChatDivMsg:string="New chat";
  username:string = "";
  inTheUserMenu:boolean = false;
  chatDeleteConfirm: number = 0;
  settingUpChat:boolean = false;
  noMoreMessages:boolean =false;
  addingMembers:boolean = false;
  newMembers:string[] = [];
  newMemberUsername:string="";
  messagesToDisplay:Message[] = [];
  newMessageText:string = "";
  members:string[]=[];

  private destroy$ = new Subject<void>();
  private stopPolling$ = new Subject<void>();

  
  constructor(private web : WebService, private cdRef: ChangeDetectorRef, private auth:AuthService,
    private router : Router
  ){
    this.retrieveChats();
    this.username = auth.username;
  }

  addMembersSwitch(){
    this.addingMembers=true;
  }


  addMemberToArray(){
    this.newMembers.push(this.newMemberUsername);
    this.newMemberUsername="";
  }

  addMembers(){
    this.loading=true;
    if (this.newMembers.find(member => member == "ISpecificallyWantToInvokeError500")){
      this.criticalError=true;
    }
    this.web.addMembersToChat(this.selectedChat!, this.newMembers).subscribe({
      error: (err:HttpResponse<any>)=>{
        this.chatSetup(null);
        this.retrieveChatMembers();
        this.loading=false;
        if (err.status==500){
          this.criticalError=true;
        }
      }
    });
  }

  chatSetup(i : MouseEvent|null){
    if (i){i.stopPropagation();}
    this.newMemberUsername="";
    this.newMembers=[];
    this.settingUpChat = !this.settingUpChat;
    this.addingMembers=false;
    this.chatDeleteConfirm=0;
  }

  deleteChat(){
    this.stopPolling$.next();
    if (this.chatDeleteConfirm==0){
      this.chatDeleteConfirm=1;
      return;
    } else {
      this.web.chatDelete(this.selectedChat!).subscribe((res:HttpErrorResponse) => {
        if (res.status == 200) {
          this.selectedChat = null;
          this.selectedChatName="";
          this.retrieveChats();
          this.chatSetup(null);
          this.cdRef.detectChanges();
        }
        if (res.status==401){
          this.chatDeleteConfirm=2;
          this.cdRef.detectChanges();
        }
        if (res.status==500){
          this.criticalError=true;
        }

      });
    }
    
  }

  logout(i:MouseEvent){
    i.stopPropagation();
    this.auth.logout().subscribe(()=>{
      localStorage.setItem('auth', "");
    });
    this.router.navigate(['/login']);
  }

  switchUserMenu(){
    this.inTheUserMenu = !this.inTheUserMenu;
  }


  selectChat(i:number, name:string){
    this.stopPolling$.next()
    this.selectedChat=i;
    this.noMoreMessages=false;
    this.web.skipMessagesAmount = 0;
    this.selectedChatName=name;
    this.messagesToDisplay=[];
    this.retrieveChatMembers();
    this.retrieveChatMessages()
    this.pollForNewMessages();
  }

  newChatToggle(){
    this.newChat = true;
  }
  newChatToggleOff(event: MouseEvent){
    event.stopPropagation();
    this.newChat = false;

  }
  newChatCreate(event: MouseEvent){
    event.stopPropagation();
    if (this.newChatName==""|| this.newChatName==null){
      this.newChat=false;
      this.newChatDivMsg="Chat has to have a name";
      timer(3000).subscribe(() => {
        this.newChatDivMsg="New chat";
        this.cdRef.detectChanges();
      });
    } else {
      this.web.newChatCreate({name:this.newChatName, members:[]}).subscribe(res => {
        if (res.status==200){
          this.newChat=false;
          this.retrieveChats();
          this.cdRef.detectChanges();
        } else if(res.status == 400) {
          this.newChatDivMsg="Such chat already exists"
          this.newChat=false;
          timer(3000).subscribe(() => {
            this.newChatDivMsg="New chat";
            this.cdRef.detectChanges();
          });
          this.cdRef.detectChanges();
        } else if (res.status=500){
          this.criticalError = true;
        }
      });
      
    }
  }

  retrieveChatMessages(){
    this.web.getLatestMessages(this.selectedChat!, "null", false).subscribe({
      next: (res)=>{
        this.messagesToDisplay = res;
        this.cdRef.detectChanges();
      },
      error: (err:HttpResponse<Message[]>)=>
      {
        if (err.status == 500){
          this.criticalError=true;
        }
      }
    });
  }

  retrieveChatMembers(){
    this.members=[];
    this.web.receiveChatMembers(this.selectedChat!).subscribe(resp => {
      resp.body
      if (resp.status == 401){
        return;
      }
      if (resp.status == 404){
        return;
      }
      if (resp.status == 200){
        this.members = resp.body as string[];
      }
      if (resp.status ==500){
        this.criticalError=true;
      }
    });
  }

  appendOlderMessages(){
    this.web.skipMessagesAmount+=10;
    this.web.getLatestMessages(this.selectedChat!, "null", false).subscribe({
      next: (res)=>{
        if (res.length==0){ this.noMoreMessages=true; }
        else{
          this.messagesToDisplay = this.messagesToDisplay.concat(res);
        }
        this.cdRef.detectChanges();
      },
      error: (err:HttpResponse<Message[]>) => {
        if (err.status == 500){
          this.criticalError = true;
        }
      }
    });
  }
  sendMessage(){
    if (this.selectedChat==null||this.newMessageText==""){return;}
    this.web.sendMessage(this.newMessageText, this.selectedChat).subscribe((res:HttpErrorResponse) =>{
      if (res.status==200){
        this.messagesToDisplay.unshift(
          {senderUsername:this.username, 
            timestamp: new Date(), 
            messageText:this.newMessageText,
            isRead:true});
        this.newMessageText="";
        this.cdRef.detectChanges();
      }
      if (res.status==500){
        this.criticalError=true;
      }
    });
  }

  retrieveChats(){
    this.loading=true;
    this.web.getUserChatList().subscribe({
      next: (i : Chat[]) => {
        this.chats = i;
        this.loading = false;
        this.cdRef.detectChanges();
      },
      error: (i:HttpResponse<any>) =>{
        if (i.status == 500){
          this.criticalError=true;
        }
      }
    });
  }

  pollForNewMessages(){
    {
    timer(0, 3000).pipe(
      switchMap(() => this.web.getLatestMessages(this.selectedChat!, "null", true)),
      takeUntil(this.stopPolling$),
      takeUntil(this.destroy$)
    ).subscribe({
      next: data => {
        this.messagesToDisplay = data.concat(this.messagesToDisplay);
        this.cdRef.detectChanges();
      },
      error: (err:HttpResponse<Message[]>) =>{
        if (err.status==500){
          this.criticalError=true;
        }
      }
    });
  }
  }



}

import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-assistant-chat',
  templateUrl: './assistant-chat.component.html',
  styleUrls: ['./assistant-chat.component.scss'],
})
export class AssistantChatComponent {
  chatOpen = false;
  formData = { name: '', email: '', message: '' };
  isKeyboardOpen = false;

  constructor(private http: HttpClient, private platform: Platform, private settingsService: SettingsService) {}

  toggleChat() {
    this.chatOpen = !this.chatOpen;

    if (this.chatOpen) {
      setTimeout(() => {
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
          chatForm.setAttribute('tabindex', '-1');
          chatForm.focus();
        }
      }, 100);
    }
  }

  async sendMessage() {
    try {
      await this.settingsService.sendMessage(
        this.formData.name,
        this.formData.email,
        this.formData.message
      );
      this.chatOpen = false;
      console.log('Message sent successfully!');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  // ✅ Detect Keyboard Open & Close Events
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isKeyboardOpen = window.innerHeight < this.platform.height();
    this.adjustChatPosition();
  }

  adjustChatPosition() {
    const chatBubble = document.querySelector('.chat-form') as HTMLElement;
    if (chatBubble) {
      if (this.isKeyboardOpen) {
        chatBubble.style.bottom = '50vh'; // Move up when keyboard is open
      } else {
        chatBubble.style.bottom = '120px'; // Reset position when keyboard closes
      }
    }
  }

}

import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-assistant-chat',
  templateUrl: './assistant-chat.component.html',
  styleUrls: ['./assistant-chat.component.scss'],
})
export class AssistantChatComponent {
  chatOpen = false;
  formData = { name: '', email: '', message: '' };

  constructor(private http: HttpClient) {}

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

  sendMessage() {
    const emailData = {
      to: 'support@example.com', // Replace with actual email
      subject: `New Message from ${this.formData.name}`,
      text: `Name: ${this.formData.name}\nEmail: ${this.formData.email}\nMessage: ${this.formData.message}`
    };

    this.http.post('https://your-backend.com/api/send-email', emailData)
      .subscribe(response => {
        console.log('Email sent!', response);
        this.chatOpen = false;
      }, error => {
        console.error('Error sending email', error);
      });
  }
}

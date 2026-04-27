export interface MailMessageDisplay {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  isRead: boolean;
  from?: { emailAddress: { name: string; address: string } };
}

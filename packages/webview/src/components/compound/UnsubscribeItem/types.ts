export interface UnsubscribeInfo {
  messageId: string;
  subject: string;
  from: string;
  hasOneClick: boolean;
  httpUrl: string | null;
  mailtoUrl: string | null;
  listUnsubscribe: string | null;
}

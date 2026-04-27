import MessageMeta from "./sub/MessageMeta";
import type { MailMessageDisplay } from "./types";
import "./MessageItem.css";

interface Props {
  message: MailMessageDisplay;
}

export default function MessageItem({ message }: Props) {
  return (
    <div className="message-item__content">
      <div className={`message-item__subject${message.isRead ? "" : " message-item__subject--unread"}`}>
        {message.subject}
      </div>
      <MessageMeta
        from={message.from}
        date={message.receivedDateTime}
        preview={message.bodyPreview}
      />
    </div>
  );
}

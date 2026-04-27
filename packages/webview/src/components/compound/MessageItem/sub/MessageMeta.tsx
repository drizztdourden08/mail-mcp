interface Props {
  from?: { emailAddress: { name: string; address: string } };
  date: string;
  preview: string;
}

export default function MessageMeta({ from, date, preview }: Props) {
  return (
    <>
      <div className="message-item__from">
        {from?.emailAddress?.name ?? from?.emailAddress?.address ?? "Unknown"}
      </div>
      <div className="message-item__preview">{preview?.slice(0, 80)}</div>
      <div className="message-item__date">{new Date(date).toLocaleString()}</div>
    </>
  );
}

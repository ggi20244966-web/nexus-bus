import { useState, type FormEvent } from 'react';
import { useTransport } from '@/services/TransportProvider';
import { useTelemetry } from '@/services/telemetryStore';
import { RippleButton } from '@/components/ui/RippleButton';

export function Composer() {
  const [text, setText] = useState('');
  const room = useTelemetry((s) => s.activeRoom);
  const transport = useTransport();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    transport.send(room, body);
    setText('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-3 border-t border-white/5 p-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Publish to #${room}…`}
        maxLength={500}
        aria-label="Message"
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none transition focus:border-accent-violet/70 focus:shadow-glow-violet placeholder:text-violet-200/30"
      />
      <RippleButton type="submit" disabled={!text.trim()} burst={0.9}>Dispatch ➤</RippleButton>
    </form>
  );
}
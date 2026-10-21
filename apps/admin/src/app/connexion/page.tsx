'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button, Card, Notice, TextField } from '@/components/ui';
import { strings } from '@/i18n/fr';
import { useAuth } from '@/lib/auth';
import { configured, supabase } from '@/lib/supabase';
import { homeFor } from '@/models/navigation';

const t = strings.login;

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const client = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const home = auth.status === 'signed-in' ? homeFor(auth.role) : null;
  useEffect(() => {
    if (home) router.replace(`/${home}`);
  }, [home, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setFailed(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card title={t.title} className="w-full max-w-sm">
        <p className="text-sm text-muted">{strings.appName}</p>
        {!configured ? <Notice tone="warning">{t.notConfigured}</Notice> : null}
        {auth.status === 'signed-in' && !auth.role ? (
          <>
            <Notice tone="warning">{t.noRole}</Notice>
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                client.clear();
              }}
            >
              {strings.shell.signOut}
            </Button>
          </>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <TextField
              label={t.email}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
              label={t.password}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {failed ? <Notice tone="danger">{t.failed}</Notice> : null}
            <Button variant="primary" type="submit" disabled={busy || !configured}>
              {busy ? t.submitting : t.submit}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}

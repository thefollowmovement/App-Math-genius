'use client';

import { useState } from 'react';

import { Button, Card, Notice, TextField } from '@/components/ui';
import { useBannedWord, useBannedWords } from '@/data/review';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';

const t = strings.review;

export function BannedWords() {
  const words = useBannedWords();
  const change = useBannedWord();
  const [word, setWord] = useState('');
  return (
    <Card title={t.banned}>
      <p className="text-sm text-muted">{t.bannedHint}</p>
      {change.error ? <Notice tone="danger">{errorText(change.error)}</Notice> : null}
      <ul className="flex flex-wrap gap-2">
        {(words.data ?? []).map((item) => (
          <li
            key={item}
            className="flex items-center gap-1 rounded-full bg-raised py-0.5 pr-1 pl-3 text-sm"
          >
            {item}
            <button
              type="button"
              className="rounded-full px-1.5 text-muted hover:bg-danger-soft hover:text-danger"
              aria-label={`${strings.remove} « ${item} »`}
              disabled={change.isPending}
              onClick={() => change.mutate({ word: item, add: false })}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const next = word.trim().toLowerCase();
          if (!next) return;
          change.mutate({ word: next, add: true }, { onSuccess: () => setWord('') });
        }}
      >
        <div className="w-64">
          <TextField
            label={t.addWord}
            value={word}
            maxLength={60}
            onChange={(event) => setWord(event.target.value)}
          />
        </div>
        <Button type="submit" variant="primary" disabled={!word.trim() || change.isPending}>
          {strings.add}
        </Button>
      </form>
    </Card>
  );
}

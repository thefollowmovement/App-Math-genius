'use client';

import { useState } from 'react';

import { Button, Card, Loading, Notice, PageHeader } from '@/components/ui';
import { useAiCosts, useAiSettings, useUpdateAiSettings } from '@/data/ai';
import { strings } from '@/i18n/fr';
import { useAuth } from '@/lib/auth';
import { errorText } from '@/lib/errors';
import { settingsDraft } from '@/models/ai-settings';

import { CostsCard } from './costs-card';
import { SettingsForm } from './settings-form';

const t = strings.ai;

export function AiView() {
  const auth = useAuth();
  const settings = useAiSettings();
  const costs = useAiCosts(30);
  const update = useUpdateAiSettings();
  const [saved, setSaved] = useState(false);
  const superAdmin = auth.status === 'signed-in' && auth.role === 'super_admin';
  const row = settings.data;

  return (
    <>
      <PageHeader title={strings.pages.ia} intro={t.intro} />
      {settings.isPending ? (
        <Loading label={strings.loading} />
      ) : settings.error || !row ? (
        <Notice tone="danger">{errorText(settings.error)}</Notice>
      ) : (
        <>
          <Card title={t.kill.title}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p
                className={`text-lg font-semibold ${row.enabled ? 'text-success' : 'text-danger'}`}
                role="status"
              >
                {row.enabled ? t.kill.on : t.kill.off}
              </p>
              {superAdmin ? (
                <Button
                  variant={row.enabled ? 'danger' : 'primary'}
                  disabled={update.isPending}
                  onClick={() => {
                    const label = row.enabled ? t.kill.switchOff : t.kill.switchOn;
                    if (window.confirm(`${label} ?`)) update.mutate({ enabled: !row.enabled });
                  }}
                >
                  {row.enabled ? t.kill.switchOff : t.kill.switchOn}
                </Button>
              ) : null}
            </div>
            {update.error ? <Notice tone="danger">{errorText(update.error)}</Notice> : null}
            {!superAdmin ? <p className="text-sm text-muted">{strings.readOnly}</p> : null}
          </Card>
          <SettingsForm
            key={row.updated_at}
            initial={settingsDraft(row)}
            editable={superAdmin}
            saved={saved}
            onSaved={setSaved}
          />
          {costs.data ? (
            <CostsCard
              costs={costs.data}
              dailyCap={row.daily_cap_usd}
              monthlyCap={row.monthly_cap_usd}
            />
          ) : costs.error ? (
            <Notice tone="danger">{errorText(costs.error)}</Notice>
          ) : null}
        </>
      )}
    </>
  );
}

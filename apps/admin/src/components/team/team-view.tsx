'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  Loading,
  Notice,
  PageHeader,
  SelectField,
  Table,
  Td,
  TextField,
  Th,
} from '@/components/ui';
import { useSetRole, useTeam } from '@/data/team';
import { strings } from '@/i18n/fr';
import { useAuth } from '@/lib/auth';
import { errorText } from '@/lib/errors';
import { formatDate } from '@/models/dates';
import type { AdminRole } from '@/models/navigation';

const t = strings.team;
const ROLES: readonly AdminRole[] = ['super_admin', 'editor', 'moderator'];
const roleOptions = ROLES.map((value) => ({ value, label: strings.roles[value] }));

/** The team and their roles (super-admin only). */
export function TeamView() {
  const auth = useAuth();
  const team = useTeam();
  const setRole = useSetRole();
  const [email, setEmail] = useState('');
  const [role, setNewRole] = useState<AdminRole>('editor');
  const me = auth.status === 'signed-in' ? auth.userId : null;

  return (
    <>
      <PageHeader title={strings.pages.equipe} intro={t.intro} />
      {setRole.error ? <Notice tone="danger">{errorText(setRole.error)}</Notice> : null}
      <Card>
        {team.isPending ? (
          <Loading label={strings.loading} />
        ) : team.error ? (
          <Notice tone="danger">{errorText(team.error)}</Notice>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.email}</Th>
                <Th>{t.role}</Th>
                <Th>{t.since}</Th>
                <Th>{strings.trends.columns.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {(team.data ?? []).map((member) => {
                const self = member.user_id === me;
                return (
                  <tr key={member.user_id}>
                    <Td>
                      {member.email}
                      {self ? <span className="ml-2 text-xs text-muted">({t.you})</span> : null}
                    </Td>
                    <Td>
                      <select
                        aria-label={`${t.role} : ${member.email}`}
                        className="rounded-md border border-border bg-surface px-2 py-1"
                        value={member.role}
                        disabled={self || setRole.isPending}
                        onChange={(event) =>
                          setRole.mutate({
                            email: member.email,
                            role: event.target.value as AdminRole,
                          })
                        }
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Td>
                    <Td>{formatDate(member.created_at)}</Td>
                    <Td>
                      {self ? null : (
                        <Button
                          small
                          variant="danger"
                          disabled={setRole.isPending}
                          onClick={() => {
                            if (window.confirm(`${t.revoke} : ${member.email} ?`)) {
                              setRole.mutate({ email: member.email, role: null });
                            }
                          }}
                        >
                          {t.revoke}
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
      <Card title={t.give}>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!email.trim()) return;
            setRole.mutate({ email: email.trim(), role }, { onSuccess: () => setEmail('') });
          }}
        >
          <div className="min-w-64 flex-1">
            <TextField
              label={t.email}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="w-64">
            <SelectField
              label={t.role}
              value={role}
              options={roleOptions}
              onChange={(event) => setNewRole(event.target.value as AdminRole)}
            />
          </div>
          <Button type="submit" variant="primary" disabled={!email.trim() || setRole.isPending}>
            {t.give}
          </Button>
        </form>
      </Card>
    </>
  );
}

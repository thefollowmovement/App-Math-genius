'use client';

import { Loading, Notice, PageHeader } from '@/components/ui';
import { useOptions, useQuestions, useUpdateQuestion } from '@/data/questionnaire';
import { useUniverses } from '@/data/universes';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { moved } from '@/models/order';

import { QuestionCard } from './question-card';

export function QuestionnaireView() {
  const questions = useQuestions();
  const options = useOptions();
  const universes = useUniverses();
  const update = useUpdateQuestion();
  const error = questions.error ?? options.error ?? universes.error ?? update.error;

  const move = (index: number, step: -1 | 1) => {
    const order = moved(questions.data ?? [], index, step);
    order.forEach((question, position) => {
      if (question.position !== position + 1) {
        update.mutate({ id: question.id, fields: { position: position + 1 } });
      }
    });
  };

  return (
    <>
      <PageHeader title={strings.pages.questionnaire} intro={strings.questionnaire.intro} />
      {error ? <Notice tone="danger">{errorText(error)}</Notice> : null}
      {questions.isPending || options.isPending || universes.isPending ? (
        <Loading label={strings.loading} />
      ) : (
        (questions.data ?? []).map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            options={(options.data ?? []).filter((option) => option.question_id === question.id)}
            universes={universes.data ?? []}
            first={index === 0}
            last={index === (questions.data?.length ?? 0) - 1}
            onMove={(step) => move(index, step)}
          />
        ))
      )}
    </>
  );
}

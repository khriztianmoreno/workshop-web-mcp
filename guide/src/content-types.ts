/** Shape of `virtual:guide-content`, produced at build time from docs/*.md. */
export type GuideTone = 'red' | 'blue' | 'green' | 'yellow';

export interface GuideStep {
  /** Stable id, also the localStorage key and the heading anchor. */
  id: string;
  label: string;
}

export interface GuideSection {
  /** milestone = "Hito", next = the doc's own "¿Te quedaste atrás?", solution = a collapsed <details>. */
  kind: 'default' | 'milestone' | 'next' | 'solution';
  html: string;
}

export interface GuideDoc {
  id: string;
  kind: 'prework' | 'act' | 'reference';
  short: string;
  tone: GuideTone;
  /** "Acto 3" (empty when the title has no prefix). */
  label: string;
  title: string;
  duration?: string;
  startTag?: string;
  solutionTag?: string;
  /** Command that starts this part from its git tag. */
  catchUp?: string;
  objectiveHtml?: string;
  introHtml: string;
  sections: GuideSection[];
  steps: GuideStep[];
}

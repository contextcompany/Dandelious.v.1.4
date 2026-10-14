import { ModelOption } from '../types';

export const GEMMA_MODELS: ModelOption[] = [
  {
    id: 'dandelious-lite',
    name: 'Dandelious Lite',
    badge: 'Lite',
    description: 'Schnellste Antworten',
    contextWindow: '1M Tokens',
    isSLM: true,
    recommendedFor: 'Schnellste Antworten',
    tierRequired: 'Kostenlos'
  },
  {
    id: 'dandelious-plus',
    name: 'Dandelious Plus',
    badge: 'Plus',
    description: 'Vielseitige Unterstützung',
    contextWindow: '1.5M Tokens',
    isSLM: false,
    recommendedFor: 'Vielseitige Unterstützung',
    tierRequired: 'Plus'
  },
  {
    id: 'dandelious-pro',
    name: 'Dandelious Pro',
    badge: 'Pro',
    description: 'Logisches Schlussfolgern & Deep Reasoning',
    contextWindow: '2M Tokens',
    isSLM: false,
    recommendedFor: 'Logisches Schlussfolgern & Deep Reasoning',
    tierRequired: 'Pro'
  }
];

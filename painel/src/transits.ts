import { createContext } from "react";
import type { Transit } from "./types";

/** Leads em trânsito nas setas; lido pelas setas para desenhar a animação. */
export const TransitsContext = createContext<Transit[]>([]);

/** Duração da viagem da bolinha pela seta (precisa bater com o CSS). */
export const DURACAO_TRANSITO_MS = 1600;

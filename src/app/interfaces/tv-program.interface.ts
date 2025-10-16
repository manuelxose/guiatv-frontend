/**
 * Interface base para programas de TV
 * Ubicación: src/app/interfaces/tv-program.interface.ts
 */

export interface ITvProgram {
  id: string;
  title: string | { lang?: string; value: string };
  start: string;
  end: string;
  channel_id: string;
  channel: IChannel;
  category?: ICategory;
  desc?: IDescription;
  starRating?: number;
  error?: string;
  channels?: any[];


}

/**
 * Interface para canales de TV
 */
export interface IChannel {
  id: string;
  name: string;
  icon: string;
  type?: string;
}

/**
 * Interface para categorías de programas
 */
export interface ICategory {
  value: string;
  lang?: string;
}

/**
 * Interface para descripciones de programas
 */
export interface IDescription {
  value?: string;
  details?: string;
  lang?: string;
}
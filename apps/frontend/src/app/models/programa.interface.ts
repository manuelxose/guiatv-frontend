export interface Programme {
  start: string;
  stop: string;
  channel: string;
  channel_id?: string;
  title: Title;
  desc: Description;
  category: Category;
  icon: string;
  rating: Rating;
  starRating: StarRating;
  type?: string;
  id?: string;
  date?: string;
}

interface Title {
  lang: string;
  value: string;
}

interface Description {
  lang: string;
  year?: number;
  votes?: string;
  details?: string;
  country?: string;
  originalTitle?: string;
  presenters?: string[];
  directors?: string[];
  cast?: string[];
  screenplay?: string[];
  music?: string[];
  production?: string[];
  comments?: string;
  rate?:string;
  category?: Category;
  producer?: string;
}

interface Category {
  lang: string;
  value: string;
}



interface Rating {
  system: string;
  value: string;
}

interface StarRating {
  system: string;
  value: string;
}

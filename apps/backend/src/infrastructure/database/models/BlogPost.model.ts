import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export type BlogContentType =
  | 'guide'
  | 'ranking'
  | 'trend'
  | 'news'
  | 'analysis'
  | 'preview'
  | 'match-report';

export interface IBlogPostCategory {
  id: number;
  name: string;
  slug: string;
}

export interface IBlogFaqItem {
  question: string;
  answer: string;
}

export interface IBlogPostDocument {
  title: string;
  slug: string;
  status: 'draft' | 'publish';
  excerpt?: string;
  content?: string;
  categories: IBlogPostCategory[];
  contentType: BlogContentType;
  featured?: boolean;
  primaryIntent?: string;
  targetQuery?: string;
  relatedPlatformKeys: string[];
  relatedRouteKeys: string[];
  sportsRelations?: {
    teamIds: string[];
    competitionIds: string[];
    matchIds: string[];
  };
  faqItems: IBlogFaqItem[];
  evergreen?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };
  featuredImage?: {
    sourceUrl?: string;
    caption?: string;
  };
  author?: {
    name?: string;
    id?: string;
  };
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogPostCategorySchema = new Schema<IBlogPostCategory>(
  {
    id: { type: Number, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, index: true },
  },
  { _id: false }
);

const BlogFaqItemSchema = new Schema<IBlogFaqItem>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const BlogPostSchema = new Schema<IBlogPostDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'publish'],
      default: 'draft',
      index: true,
    },
    excerpt: { type: String, trim: true },
    content: { type: String },
    categories: { type: [BlogPostCategorySchema], default: [] },
    contentType: {
      type: String,
      enum: ['guide', 'ranking', 'trend', 'news', 'analysis', 'preview', 'match-report'],
      default: 'guide',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    primaryIntent: { type: String, trim: true },
    targetQuery: { type: String, trim: true },
    relatedPlatformKeys: { type: [String], default: [] },
    relatedRouteKeys: { type: [String], default: [] },
    sportsRelations: {
      teamIds: { type: [String], default: [] },
      competitionIds: { type: [String], default: [] },
      matchIds: { type: [String], default: [] },
    },
    faqItems: { type: [BlogFaqItemSchema], default: [] },
    evergreen: { type: Boolean, default: true, index: true },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: { type: [String], default: [] },
      ogImage: { type: String, trim: true },
      canonicalUrl: { type: String, trim: true },
    },
    featuredImage: {
      sourceUrl: { type: String, trim: true },
      caption: { type: String, trim: true },
    },
    author: {
      name: { type: String, trim: true },
      id: { type: String, trim: true },
    },
    publishedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    collection: 'blog_posts',
  }
);

BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ contentType: 1, status: 1, publishedAt: -1 });
BlogPostSchema.index({ 'categories.slug': 1, publishedAt: -1 });
BlogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export const BlogPostModel = mongoose.model<IBlogPostDocument>(
  'BlogPost',
  BlogPostSchema
);

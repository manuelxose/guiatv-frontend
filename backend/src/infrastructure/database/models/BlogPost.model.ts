import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export interface IBlogPostCategory {
  id: number;
  name: string;
  slug: string;
}

export interface IBlogPostDocument {
  title: string;
  slug: string;
  status: 'draft' | 'publish';
  excerpt?: string;
  content?: string;
  categories: IBlogPostCategory[];
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
BlogPostSchema.index({ 'categories.slug': 1, publishedAt: -1 });
BlogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export const BlogPostModel = mongoose.model<IBlogPostDocument>(
  'BlogPost',
  BlogPostSchema
);

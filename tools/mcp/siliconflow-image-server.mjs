#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';

const workspaceRoot = path.resolve(process.env.WORKSPACE_ROOT || process.cwd());
const apiKey = String(process.env.SILICONFLOW_API_KEY || '').trim();
const baseUrl = String(process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.com/v1').replace(/\/$/, '');
const defaultModel = String(process.env.SILICONFLOW_IMAGE_MODEL || 'black-forest-labs/FLUX.2-pro').trim();
const defaultImageSize = String(process.env.SILICONFLOW_IMAGE_SIZE || '1024x576').trim();
const defaultOutputFormat = String(process.env.SILICONFLOW_IMAGE_FORMAT || 'png').trim().toLowerCase();
const defaultProject = String(process.env.SILICONFLOW_DEFAULT_PROJECT || 'shared').trim();
const defaultOutputDir = String(process.env.SILICONFLOW_OUTPUT_DIR || 'generated-assets').trim();
const supportedImageSizes = new Set(['512x512', '768x1024', '1024x768', '576x1024', '1024x576']);
const supportedOutputFormats = new Set(['png', 'jpeg']);

const server = new McpServer(
  {
    name: 'siliconflow-images',
    version: '1.0.0',
  },
  {
    capabilities: {
      logging: {},
    },
  }
);

const http = axios.create({
  baseURL: baseUrl,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  },
});

function requireApiKey() {
  if (!apiKey) {
    throw new Error('SILICONFLOW_API_KEY is not configured. Add it to the workspace .env file or /etc/siliconflow.env.');
  }
}

function resolveImageSize(rawValue) {
  const value = String(rawValue || defaultImageSize).trim();
  if (!supportedImageSizes.has(value)) {
    throw new Error(
      `Unsupported imageSize "${value}". Use one of: ${Array.from(supportedImageSizes).join(', ')}.`
    );
  }

  return value;
}

function resolveOutputFormat(rawValue) {
  const value = String(rawValue || defaultOutputFormat).trim().toLowerCase();
  if (!supportedOutputFormats.has(value)) {
    throw new Error(
      `Unsupported outputFormat "${value}". Use one of: ${Array.from(supportedOutputFormats).join(', ')}.`
    );
  }

  return value;
}

function toWorkspacePath(targetPath) {
  const resolved = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(workspaceRoot, targetPath);
  const relative = path.relative(workspaceRoot, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('outputPath must stay inside the workspace.');
  }

  return resolved;
}

function slugifyPrompt(prompt) {
  const slug = String(prompt || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug || 'generated-image';
}

function getExtensionFromMimeType(mimeType) {
  switch (String(mimeType || '').toLowerCase()) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.png';
  }
}

function getMimeTypeFromUrl(url) {
  try {
    const extension = path.extname(new URL(url).pathname).toLowerCase();

    switch (extension) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.png':
        return 'image/png';
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function normalizeProjectName(project) {
  const normalized = String(project || defaultProject)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || defaultProject;
}

function inferProjectNameFromPath(targetPath) {
  if (!targetPath) {
    return null;
  }

  const normalized = String(targetPath).replace(/\\/g, '/');
  const match = normalized.match(/(?:^|\/)apps\/([^/]+)\//);
  return match?.[1] ? normalizeProjectName(match[1]) : null;
}

function resolveProjectName(project, assetOutputPath) {
  const explicitProject = String(project || '').trim();

  if (explicitProject) {
    return inferProjectNameFromPath(explicitProject) || normalizeProjectName(explicitProject);
  }

  return inferProjectNameFromPath(assetOutputPath) || normalizeProjectName(defaultProject);
}

function buildOutputBasePath(outputPath, prompt, index, total, project) {
  const suffix = total > 1 ? `-${index + 1}` : '';

  if (outputPath) {
    const resolved = toWorkspacePath(outputPath);
    const parsed = path.parse(resolved);
    return path.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${stamp}-${slugifyPrompt(prompt)}${suffix}`;
  return path.join(
    toWorkspacePath(path.join(defaultOutputDir, normalizeProjectName(project))),
    fileName
  );
}

function withExtension(filePath, mimeType) {
  return path.extname(filePath) ? filePath : `${filePath}${getExtensionFromMimeType(mimeType)}`;
}

async function writeImageToPath(basePath, mimeType, buffer) {
  const finalOutputPath = withExtension(basePath, mimeType);
  await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
  await fs.writeFile(finalOutputPath, buffer);
  return finalOutputPath;
}

async function fetchImageBuffer(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000,
  });

  const responseMimeType = String(response.headers['content-type'] || '')
    .split(';')[0]
    .trim();
  const mimeType =
    !responseMimeType || responseMimeType === 'application/octet-stream' || responseMimeType === 'binary/octet-stream'
      ? getMimeTypeFromUrl(url) || 'image/png'
      : responseMimeType;
  const buffer = Buffer.from(response.data);

  return {
    buffer,
    mimeType,
    sizeBytes: buffer.byteLength,
  };
}

function normalizeAxiosError(error) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unknown SiliconFlow error.';
  }

  const status = error.response?.status;
  const details =
    typeof error.response?.data === 'string'
      ? error.response.data
      : JSON.stringify(error.response?.data || { message: error.message }, null, 2);

  return status ? `HTTP ${status}\n${details}` : error.message;
}

server.registerTool(
  'generate_image',
  {
    description:
      'Generate images with SiliconFlow, save them into the workspace, and return the first image inline for agent use.',
    inputSchema: {
      prompt: z.string().min(1).max(4000).describe('Image prompt to send to SiliconFlow.'),
      negativePrompt: z
        .string()
        .max(4000)
        .optional()
        .describe('Optional negative prompt with elements to avoid.'),
      model: z
        .string()
        .optional()
        .describe(`SiliconFlow image model. Defaults to ${defaultModel}.`),
      project: z
        .string()
        .optional()
        .describe(`Project bucket under ${defaultOutputDir}/. If omitted, it can be inferred from assetOutputPath, otherwise it falls back to ${defaultProject}.`),
      imageSize: z
        .string()
        .optional()
        .describe(
          `Resolution in widthxheight format. Supported sizes: ${Array.from(supportedImageSizes).join(', ')}. Defaults to ${defaultImageSize}.`
        ),
      outputFormat: z
        .string()
        .optional()
        .describe(`SiliconFlow image format. Supported values: ${Array.from(supportedOutputFormats).join(', ')}. Defaults to ${defaultOutputFormat}.`),
      batchSize: z
        .number()
        .int()
        .min(1)
        .max(4)
        .optional()
        .describe('How many images to generate. Qwen image models currently support 1.'),
      numInferenceSteps: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Number of inference steps. Defaults to 20.'),
      guidanceScale: z
        .number()
        .positive()
        .max(20)
        .optional()
        .describe('Prompt adherence. Higher is stricter, lower is more creative.'),
      seed: z
        .number()
        .int()
        .min(0)
        .max(9999999999)
        .optional()
        .describe('Optional deterministic seed.'),
      outputPath: z
        .string()
        .optional()
        .describe(`Optional workspace-relative path for the managed copy stored under ${defaultOutputDir}/ or another workspace folder. Extra images add -2, -3, etc.`),
      assetOutputPath: z
        .string()
        .optional()
        .describe('Optional workspace-relative file path for the product-ready asset copy, for example apps/frontend/src/assets/...'),
      download: z
        .boolean()
        .optional()
        .describe('Save images locally. Defaults to true.'),
      includeInlineImage: z
        .boolean()
        .optional()
        .describe('Return the first image inline to clients that support image results. Defaults to true.'),
    },
    outputSchema: {
      model: z.string(),
      project: z.string(),
      prompt: z.string(),
      imageSize: z.string(),
      outputFormat: z.string(),
      batchSize: z.number().int().min(1),
      seed: z.number().int().optional(),
      timings: z.record(z.string(), z.number()).optional(),
      images: z.array(
        z.object({
          index: z.number().int().min(1),
          url: z.string(),
          path: z.string().optional(),
          assetPath: z.string().optional(),
          mimeType: z.string().optional(),
          sizeBytes: z.number().int().optional(),
        })
      ),
    },
  },
  async ({
    prompt,
    negativePrompt,
    model,
    project,
    imageSize,
    outputFormat,
    batchSize,
    numInferenceSteps,
    guidanceScale,
    seed,
    outputPath,
    assetOutputPath,
    download,
    includeInlineImage,
  }) => {
    try {
      requireApiKey();

      const selectedModel = String(model || defaultModel).trim();
      const selectedProject = resolveProjectName(project, assetOutputPath);
      const selectedImageSize = resolveImageSize(imageSize);
      const selectedOutputFormat = resolveOutputFormat(outputFormat);
      const selectedBatchSize = Number(batchSize || 1);
      const shouldDownload = download !== false;
      const shouldInline = includeInlineImage !== false;

      if (/qwen\/qwen-image/i.test(selectedModel) && selectedBatchSize !== 1) {
        throw new Error('Qwen image models only support batchSize=1 in this workspace integration.');
      }

      const payload = {
        model: selectedModel,
        prompt: String(prompt).trim(),
        image_size: selectedImageSize,
        output_format: selectedOutputFormat,
        num_inference_steps: Number(numInferenceSteps || 20),
        ...(negativePrompt?.trim() ? { negative_prompt: negativePrompt.trim() } : {}),
        ...(selectedBatchSize > 1 ? { batch_size: selectedBatchSize } : {}),
        ...(guidanceScale !== undefined ? { guidance_scale: guidanceScale } : {}),
        ...(seed !== undefined ? { seed } : {}),
      };

      const response = await http.post('/images/generations', payload);
      const imageUrls = Array.isArray(response.data?.images)
        ? response.data.images
            .map((image) => String(image?.url || '').trim())
            .filter(Boolean)
        : [];

      if (!imageUrls.length) {
        throw new Error('SiliconFlow returned no image URLs.');
      }

      const images = [];
      let inlineImage = null;

      for (let index = 0; index < imageUrls.length; index += 1) {
        const url = imageUrls[index];
        const imageRecord = {
          index: index + 1,
          url,
        };

        if (shouldDownload) {
          const { buffer, mimeType, sizeBytes } = await fetchImageBuffer(url);
          const outputBasePath = buildOutputBasePath(
            outputPath,
            prompt,
            index,
            imageUrls.length,
            selectedProject
          );
          const finalOutputPath = await writeImageToPath(outputBasePath, mimeType, buffer);

          imageRecord.path = path.relative(workspaceRoot, finalOutputPath).split(path.sep).join('/');
          imageRecord.mimeType = mimeType;
          imageRecord.sizeBytes = sizeBytes;

          if (assetOutputPath) {
            const assetBasePath = buildOutputBasePath(
              assetOutputPath,
              prompt,
              index,
              imageUrls.length,
              selectedProject
            );
            const finalAssetPath = await writeImageToPath(assetBasePath, mimeType, buffer);
            imageRecord.assetPath = path.relative(workspaceRoot, finalAssetPath).split(path.sep).join('/');
          }

          if (index === 0 && shouldInline) {
            inlineImage = {
              data: buffer.toString('base64'),
              mimeType,
            };
          }
        }

        images.push(imageRecord);
      }

      const structuredContent = {
        model: selectedModel,
        project: selectedProject,
        prompt: String(prompt).trim(),
        imageSize: selectedImageSize,
        outputFormat: selectedOutputFormat,
        batchSize: images.length,
        ...(typeof response.data?.seed === 'number' ? { seed: response.data.seed } : {}),
        ...(response.data?.timings ? { timings: response.data.timings } : {}),
        images,
      };

      const summaryLines = [
        `Generated ${images.length} image(s) with ${selectedModel}.`,
        shouldDownload
          ? `Saved locally: ${images.map((image) => image.path).filter(Boolean).join(', ')}`
          : 'Images were not downloaded locally.',
      ];

      const publishedAssetPaths = images.map((image) => image.assetPath).filter(Boolean);
      if (publishedAssetPaths.length) {
        summaryLines.push(`Published asset copies: ${publishedAssetPaths.join(', ')}`);
      }

      const content = [
        {
          type: 'text',
          text: `${summaryLines.join('\n')}\n\n${JSON.stringify(structuredContent, null, 2)}`,
        },
      ];

      if (inlineImage) {
        content.push({
          type: 'image',
          data: inlineImage.data,
          mimeType: inlineImage.mimeType,
        });
      }

      return {
        content,
        structuredContent,
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `SiliconFlow image generation failed.\n${normalizeAxiosError(error)}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`siliconflow-images MCP server running on stdio (workspace: ${workspaceRoot})`);
}

main().catch((error) => {
  console.error('siliconflow-images MCP server failed:', error);
  process.exit(1);
});

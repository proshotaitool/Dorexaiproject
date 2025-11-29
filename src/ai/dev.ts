import { config } from 'dotenv';
config();

import '@/ai/flows/text-summarization.ts';
import '@/ai/flows/ai-background-remover.ts';
import '@/ai/flows/image-resizer-flow.ts';
import '@/ai/flows/image-compressor-flow.ts';
import '@/ai/flows/image-cropper-flow.ts';
import '@/ai/flows/image-straighten-flow.ts';
import '@/ai/flows/suggest-jpg-quality-flow.ts';
import '@/ai/flows/face-blur-flow.ts';
import '@/ai/flows/image-upscaler-flow.ts';
import '@/ai/flows/ai-photo-editor-flow.ts';
import '@/ai/flows/ai-content-generator-flow.ts';
import '@/ai/flows/detect-faces-flow.ts';
import '@/ai/flows/html-to-image-flow.ts';

/**
 * Typed API Client with Zod Validation & AbortController Support (TSK-UI-PRO Item 20)
 */

import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Robust fetch wrapper with automatic timeout, AbortController, and JSON parsing.
 */
export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
  schema?: z.ZodSchema<T>
): Promise<T> {
  const { timeoutMs = 15000, signal, ...customConfig } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link caller signal if provided
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...customConfig.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Fallback for non-JSON errors
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    const data = await response.json();

    if (schema) {
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        console.warn(`[Zod Warning] Schema validation failed for ${url}:`, parsed.error.issues);
        // In development/production, return parsed data or fall back gracefully
        return data as T;
      }
      return parsed.data;
    }

    return data as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms or was aborted.`);
    }
    throw error;
  }
}

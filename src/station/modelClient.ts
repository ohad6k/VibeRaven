import * as vscode from 'vscode';
import { isNetworkFetchFailure } from './fetchUtils';
import { normalizeModelOutput } from './engines';
import { ModelStationOutput } from './types';

export const OPENAI_API_KEY_SECRET_KEY = 'viberice.openaiApiKey';

interface FetchStationOutputOptions {
  apiKey?: string;
}

type SecretStorageReader = Pick<vscode.SecretStorage, 'get'>;

export async function resolveStationApiKey(
  secrets?: SecretStorageReader
): Promise<string | undefined> {
  const storedKey = asNonEmptyString(await secrets?.get(OPENAI_API_KEY_SECRET_KEY));
  return storedKey ?? asNonEmptyString(process.env.OPENAI_API_KEY);
}

export async function fetchStationOutput(
  prompt: string,
  configuration: vscode.WorkspaceConfiguration,
  options: FetchStationOutputOptions = {}
): Promise<ModelStationOutput> {
  const apiKey = asNonEmptyString(options.apiKey) ?? (await resolveStationApiKey());
  if (!apiKey) {
    throw new Error('No OpenAI API key configured. Use "VibeRaven: Set API Key" or set OPENAI_API_KEY.');
  }

  const apiUrl =
    getConfigurationValue<string>(configuration, 'apiUrl') ?? 'https://api.openai.com/v1/responses';
  const model = getConfigurationValue<string>(configuration, 'model') ?? 'gpt-5.4-mini';
  const stationTemperature = getConfigurationValue<number>(configuration, 'stationTemperature');

  if (!apiUrl) {
    throw new Error('VibeRaven model endpoint is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature:
          typeof stationTemperature === 'number' && !Number.isNaN(stationTemperature)
            ? Math.min(2, Math.max(0, stationTemperature))
            : 0
      })
    });
  } catch (error) {
    if (isNetworkFetchFailure(error)) {
      throw new Error(
        `Could not reach the model endpoint (${apiUrl}). Check your network or local proxy if you enabled local Station fallback.`,
        { cause: error }
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Model request failed with ${response.status}`);
  }

  const payload = parseResponsePayload(await response.text());
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error('Model response did not include output_text.');
  }

  let parsed: Partial<ModelStationOutput>;

  try {
    parsed = JSON.parse(outputText) as Partial<ModelStationOutput>;
  } catch (error) {
    throw new Error('Model response output_text was not valid JSON.', { cause: error });
  }

  return normalizeModelOutput(parsed);
}

function getConfigurationValue<T>(configuration: vscode.WorkspaceConfiguration, key: string): T | undefined {
  return configuration.get<T>(`viberaven.${key}`) ?? configuration.get<T>(`viberice.${key}`);
}

function parseResponsePayload(rawPayload: string): unknown {
  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    throw new Error('Model response was not valid JSON.', { cause: error });
  }
}

function extractOutputText(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const directOutputText = asNonEmptyString(payload.output_text);
  if (directOutputText) {
    return directOutputText;
  }

  if (!Array.isArray(payload.output)) {
    return undefined;
  }

  for (const outputItem of payload.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (!isRecord(contentItem) || contentItem.type !== 'output_text') {
        continue;
      }

      const nestedOutputText = asNonEmptyString(contentItem.text);
      if (nestedOutputText) {
        return nestedOutputText;
      }
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

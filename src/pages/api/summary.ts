import { NextApiRequest, NextApiResponse } from 'next';

interface SummaryRequest {
  text: string;
  range: {
    type: 'chapter' | 'range';
    start: string;
    end?: string;
  };
}

interface SummaryResponse {
  summary: string;
}

interface LLMConfig {
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface APIError extends Error {
  status?: number;
  code?: string;
}

const isOpenAIEndpoint = (url: string): boolean => {
  return url.includes('openai.com');
};

const handleAPIError = (error: unknown): never => {
  const apiError = error as APIError;
  console.error('API call error:', {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code
  });

  // エラーメッセージをユーザーフレンドリーに変換
  let userMessage = 'エラーが発生しました。';
  if (apiError.status === 401) {
    userMessage = 'APIキーが無効です。';
  } else if (apiError.status === 429) {
    userMessage = 'レートリミットに達しました。しばらく待ってから再試行してください。';
  } else if (apiError.message.includes('Failed to fetch') || apiError.status === 503) {
    userMessage = 'APIサーバーに接続できません。エンドポイントURLを確認してください。';
  }

  throw new Error(userMessage);
};

const callLLMAPI = async (config: LLMConfig, text: string): Promise<string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  try {
    const isOpenAI = isOpenAIEndpoint(config.apiEndpoint);
    // OpenAIとOllamaで異なるリクエスト形式を使用
    const requestBody = isOpenAI ? {
      model: config.modelName || 'gpt-3.5-turbo',
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: text }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    } : {
      model: config.modelName,
      prompt: `${config.systemPrompt}\n\n${text}`,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    };

    console.log('Sending request to LLM API:', {
      endpoint: config.apiEndpoint,
      model: config.modelName,
      isOpenAI
    });

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = new Error('要約の生成に失敗しました') as APIError;
      error.status = response.status;
      throw error;
    }

    let result = '';

    if (isOpenAI) {
      const responseData = await response.json();
      result = responseData.choices[0]?.message?.content || '';
    } else {
      // Ollamaのストリーミングレスポンスを処理
      const responseText = await response.text();
      const lines = responseText.trim().split('\n');
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            result += data.response;
          }
        } catch (parseError) {
          console.error('Failed to parse line:', line, parseError);
        }
      }
    }

    if (!result) {
      throw new Error('要約の生成に失敗しました: レスポンスが空です');
    }

    // レスポンスからメタ情報を除去
    return result
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<[^>]*>[\s\S]*?<\/[^>]*>/g, '')
      .replace(/\/?think|<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  } catch (error) {
    return handleAPIError(error);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SummaryResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, range, config } = req.body as SummaryRequest & { config: LLMConfig };
    if (!text) {
      return res.status(400).json({ error: '要約するテキストが必要です' });
    }

    if (!config?.apiEndpoint) {
      return res.status(400).json({ error: 'APIエンドポイントが設定されていません' });
    }

    const summary = await callLLMAPI(config, text);
    res.status(200).json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    res.status(500).json({ error: message });
  }
}

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
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const getLLMConfig = (): LLMConfig => {
  return {
    apiEndpoint: process.env.LLM_API_ENDPOINT || 'http://localhost:11434/api/generate',
    modelName: process.env.LLM_MODEL_NAME || 'qwen3:4b',
    temperature: Number(process.env.LLM_TEMPERATURE) || 0.7,
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 500,
    systemPrompt: process.env.LLM_SYSTEM_PROMPT || '以下のテキストを簡潔に要約してください。日本語の自然な文章で出力してください。プロンプトの解釈やthinkタグなどのメタ情報は含めないでください。',
  };
};

const callOllamaAPI = async (config: LLMConfig, text: string): Promise<string> => {
  try {
    console.log('Sending request to Ollama:', {
      endpoint: config.apiEndpoint,
      model: config.modelName,
      prompt: `${config.systemPrompt}\n\n${text}`,
    });

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.modelName,
        prompt: `${config.systemPrompt}\n\n${text}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error('要約の生成に失敗しました: ' + errorText);
    }

    let responseText = await response.text();
    console.log('Raw Ollama response:', responseText);

    // レスポンスを行ごとに分割し、各JSONをパース
    const lines = responseText.trim().split('\n');
    let fullResponse = '';

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.response) {
          fullResponse += data.response;
        }
      } catch (parseError) {
        console.error('Failed to parse line:', line, parseError);
      }
    }

    if (!fullResponse) {
      throw new Error('要約の生成に失敗しました');
    }

    // レスポンスからメタ情報を除去
    let cleanedResponse = fullResponse
      // thinkタグとその内容を削除
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      // その他のタグと内容を削除
      .replace(/<[^>]*>[\s\S]*?<\/[^>]*>/g, '')
      // 単独のタグを削除
      .replace(/\/?think|<[^>]*>/g, '')
      // 空行を1行に整理
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleanedResponse;
  } catch (error) {
    console.error('Ollama API call error:', error);
    throw error;
  }
};

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse<SummaryResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, range } = req.body as SummaryRequest;
    if (!text) {
      return res.status(400).json({ error: '要約するテキストが必要です' });
    }

    const config = getLLMConfig();
    const summary = await callOllamaAPI(config, text);

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Summary generation error:', {
      error,
      message: error instanceof Error ? error.message : '不明なエラー'
    });
    res.status(500).json({ error: '要約の生成中にエラーが発生しました。後でもう一度お試しください。' });
  }
}

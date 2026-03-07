import OpenAI from "openai"

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }
  return new OpenAI({ apiKey })
}

export async function generateAIAnalysis(prompt: string): Promise<string> {
  try {
    const client = getOpenAIClient()
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
    return response.choices[0]?.message?.content ?? ""
  } catch (error) {
    console.error("OpenAI API error:", error)
    throw new Error("AI analysis generation failed")
  }
}

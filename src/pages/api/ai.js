// src/pages/api/ai.js
export const prerender = false; // 이 페이지는 서버에서 실시간으로 작동해야 함을 명시

export async function POST({ request }) {
  try {
    // 1. .env 파일에 숨겨둔 Gemini API 키를 가져옵니다.
    const apiKey = import.meta.env.GEMINI_API_KEY;
    
    // 2. 구글 Gemini 서버로 요청을 보냅니다. (가볍고 빠른 1.5 Flash 모델 사용)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "제너러티브 아트를 만드는 아티스트를 위한 짧고 시적인 영감의 문장을 한 줄만 한국어로 만들어줘." }] }]
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text; // AI가 대답한 핵심 텍스트만 쏙 빼냅니다.

    // 3. 브라우저(프론트엔드)로 결과를 성공적으로 돌려보냅니다.
    return new Response(JSON.stringify({ message: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 에러가 났을 때의 처리
    return new Response(JSON.stringify({ error: "AI 연결에 실패했습니다." }), { status: 500 });
  }
}
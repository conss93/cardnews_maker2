export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { topic, contentType } = req.body;

    const typeNames = {
      awareness: '인식 확장형',
      info: '정보 제공형',
      quiz: '자가진단형',
      case: '사례/Before-After형',
    };

    const typeStructures = {
      awareness:
        '공감(1장) → 반전/긴장(1장) → 정보①②(2장) → 구체적 대상(1장) → 신뢰/경험(1장) → 저장 유도 요약(1장) → CTA(1장). 총 8장.',
      info: '문제제기(1장) → 비교/정리(3~4장, 항목별) → 결론 및 추천(1장) → 저장 유도(1장) → CTA(1장). 총 7~8장.',
      quiz: '훅/공감(1장) → 체크리스트 항목(3~4장, 각 2~3개 항목) → 결과 해석(1장) → 저장 유도(1장) → CTA(1장). 총 7~8장.',
      case: '문제 상황 소개(1장) → Before 묘사(1장) → 변화 과정(1~2장) → After/결과(1장) → 배울 점 요약(1장) → CTA(1장). 총 6~7장.',
    };

    const systemPrompt = `당신은 청새치웹의 인스타그램 콘텐츠 전문가입니다.

[브랜드 정보]
- 브랜드명: 청새치웹
- 슬로건: 시행착오는 내가, 결과는 당신이
- 브랜드 컬러: #1A5BB5 (파란색)
- 운영자: 데빈 (제주 기반, HR 직장인 + 웹디자인/브랜딩 사이드 비즈니스)

[타겟]
- 소상공인 (홈페이지가 없거나, 있어도 전환이 안 되는 분들)
- 인스타는 하고 있는데 홈페이지는 망설이는 분들
- 제주 및 전국 소규모 사업자

[톤앤매너]
- 친근하지만 전문적 (과하지 않게)
- 공감에서 시작해서 정보로 이어지는 흐름
- 어렵지 않은 말, 현실적인 예시
- 저장하고 싶게 만드는 구성
- CTA는 부드럽게, 강요 느낌 없이

[출력 형식 - 반드시 아래 형식을 정확히 따를 것]
각 장을 다음 형식으로 작성:
[N장 - 역할]
제목: (짧고 강렬한 한 줄)
본문: (2~4줄 본문 내용)
---
마지막에 [캡션] 섹션 작성:
첫 줄 훅 → 본문 2~3문장 → 해시태그 10~15개
해시태그는 #홈페이지제작 #소상공인 #청새치웹 등 포함`;

    const userPrompt = `주제: ${topic}
콘텐츠 유형: ${typeNames[contentType]}
구성 방식: ${typeStructures[contentType]}

1장은 인스타 스크롤을 멈추게 하는 썸네일 카피로 작성해주세요. 강한 훅, 짧은 제목, 호기심을 자극하는 본문 한 줄.
나머지 장은 구성 방식에 따라 작성해주세요.
마지막에 [캡션] 섹션도 작성해주세요.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const text = data.content?.map((b) => b.text || '').join('') || '';
    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

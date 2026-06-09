export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { topic, contentType, cardCount = 8, tone = 'friendly' } = req.body;

    const typeNames = {
      awareness: '인식 확장형', info: '정보 제공형',
      quiz: '자가진단형', case: '사례/Before-After형',
    };

    const toneDesc = {
      friendly: '친근하고 공감하는 톤. 독자의 마음을 먼저 이해하고 편한 말투로 정보를 전달한다.',
      professional: '전문적이고 신뢰감 있는 톤. 데이터와 근거를 바탕으로 명확하게 설명한다.',
      humorous: '유머러스하고 가벼운 톤. 위트 있는 표현으로 독자가 부담 없이 읽게 한다.',
      emotional: '감성적이고 따뜻한 톤. 이야기처럼 흘러가며 독자의 감정을 자극한다.',
      direct: '직설적이고 핵심만 전달하는 톤. 군더더기 없이 핵심 정보만 압축한다.',
    };

    const typeStructures = {
      awareness: '공감(1장) → 반전/긴장(1장) → 정보 전달(여러 장) → 구체적 대상(1장) → 신뢰/경험(1장) → 저장 유도 요약(1장) → CTA(1장).',
      info: '문제제기(1장) → 비교/정리(여러 장, 항목별) → 결론 및 추천(1장) → 저장 유도(1장) → CTA(1장).',
      quiz: '훅/공감(1장) → 체크리스트 항목(여러 장, 각 2~3개 항목) → 결과 해석(1장) → 저장 유도(1장) → CTA(1장).',
      case: '문제 상황 소개(1장) → Before 묘사(1장) → 변화 과정(여러 장) → After/결과(1장) → 배울 점 요약(1장) → CTA(1장).',
    };

    const systemPrompt = `당신은 청새치웹의 인스타그램 콘텐츠 전문가입니다.

[브랜드 정보]
- 브랜드명: 청새치웹
- 슬로건: 홈페이지는 "구조"입니다
- 브랜드 컬러: #1A5BB5 (파란색)
- 운영자: 데빈 (제주 기반, HR 직장인 + 웹디자인/브랜딩 사이드 비즈니스)

[타겟]
- 소상공인 (홈페이지가 없거나, 있어도 전환이 안 되는 분들)
- 인스타는 하고 있는데 홈페이지는 망설이는 분들
- 제주 및 전국 소규모 사업자

[출력 형식 — 반드시 아래 형식을 정확히 따를 것]
각 장을 다음 형식으로 작성:
[N장 - 역할]
제목: (짧고 강렬한 한 줄)
본문: (내용)
---
마지막에 [캡션] 섹션 작성.
캡션: 첫 줄 훅 → 본문 4~6문장 (핵심 내용을 충분히 풀어서) → 해시태그 12~15개
해시태그: #홈페이지제작 #소상공인 #청새치웹 #웹디자인 등 포함
캡션은 카드뉴스 내용의 본질을 해치지 않으면서 충분한 분량으로 작성할 것.`;

    const userPrompt = `주제: ${topic}
콘텐츠 유형: ${typeNames[contentType]}
장 수: ${cardCount}장 (1장은 썸네일)
구성 방식: ${typeStructures[contentType]}
톤앤매너: ${toneDesc[tone]}

1장은 인스타 스크롤을 멈추게 하는 썸네일 카피로 작성. 강한 훅, 짧은 제목, 호기심을 자극하는 본문 한두 줄.
나머지 장은 구성 방식에 맞게 ${cardCount}장 총량으로 배분해서 작성.
마지막에 [캡션] 섹션 작성.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

    const text = data.content?.map(b => b.text || '').join('') || '';
    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    // 1. 텔레그램에서 날아온 메시지 수신
    const body = await req.json();
    const message = body.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text;

    // 2. 기본 응답 메시지 설정
    let replyText = "명령을 내려주십시오. (예: /메모 오늘 좋은 아이디어가 떠올랐어)";

    // 3. '/메모' 명령어 처리 로직 (AI 연결)
    if (text.startsWith("/메모")) {
        const userMemo = text.replace("/메모", "").trim();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        
        // 빠르고 가벼운 flash 모델 사용
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        
        const res = await model.generateContent(`다음 메모를 비즈니스 인사이트로 멋지게 정리해줘: ${userMemo}`);
        replyText = `💡 [AI 비서의 메모 정리 완료]\n\n${res.response.text()}`;
    }

    // 4. 텔레그램으로 AI의 답변 전송
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: replyText }),
        });
    }

    return NextResponse.json({ ok: true });
}
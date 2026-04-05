import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // AI가 긴 글을 쓸 수 있도록 5분 허용

export async function GET(req: Request) {
    try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

        // 1. 대기열에서 글 작성 대기 중인 종목 딱 1개 가져오기
        const { data: queueData, error: queueError } = await supabase
            .from("seo_queue")
            .select("ticker")
            .is("status", null)
            .limit(1)
            .single();

        // 🚨 [무한 동력의 핵심] 대기열이 비었다면? 공장을 멈추지 않고 모두 리셋!
        if (queueError || !queueData) {
            await supabase.from("seo_queue").update({ status: null }).in("status", ['done', 'error']);
            return NextResponse.json({ ok: true, message: "🔄 대기열 초기화 완료! 공장이 무한 순환합니다." });
        }

        const ticker = queueData.ticker.toUpperCase();

        try {
            // 2. 구글 SEO 최적화 전문 프롬프트
            const prompt = `
            당신은 구글 검색 랭킹 1위의 월스트리트 수석 애널리스트입니다.
            미국 주식 '${ticker}'의 실시간 뉴스, 주가, 재무 지표를 검색하고 2000자 이상의 한국어 리포트를 작성하세요.
            반드시 JSON 형식으로 {"title": "제목", "content_html": "HTML본문"} 만 출력하세요.
            `;

            const model = genAI.getGenerativeModel({ 
                model: "gemini-3.1-flash-lite-preview",
                tools: [{ googleSearch: {} } as any], 
                generationConfig: { responseMimeType: "application/json" } 
            });
            
            const res = await model.generateContent(prompt);
            const rawText = res.response.text();
            
            // 🚨 [에러 방어막] AI가 불필요한 텍스트를 붙여도 순수한 JSON만 칼같이 추출
            const startIndex = rawText.indexOf('{');
            const endIndex = rawText.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1) throw new Error("JSON 구조 오류");
            
            const cleanJsonStr = rawText.substring(startIndex, endIndex + 1);
            const parsedData = JSON.parse(cleanJsonStr);

            // 3. 완성된 기사를 창고(DB)에 저장
            const { error: insertError } = await supabase.from("seo_posts").insert([{
                ticker: ticker,
                title: parsedData.title,
                content_html: parsedData.content_html
            }]);

            if (insertError) throw insertError;

            // 4. 대기열 상태를 '완료(done)'로 업데이트
            await supabase.from("seo_queue").update({ status: 'done' }).eq("ticker", ticker);
            return NextResponse.json({ ok: true, message: `✅ [${ticker}] 자동 포스팅 완료!` });

        } catch (err: any) {
            // 🚨 에러 발생 시 상태를 'error'로 기록. 위쪽 리셋 로직이 알아서 살려냅니다.
            await supabase.from("seo_queue").update({ status: 'error' }).eq("ticker", ticker);
            return NextResponse.json({ ok: false, message: `❌ [${ticker}] 에러 발생: ${err.message}` });
        }

    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message });
    }
}
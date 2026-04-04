import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import crypto from 'crypto';

export const dynamic = "force-dynamic";

// 🚨 쿠팡 파트너스 골드박스 데이터 획득 함수
async function getCoupangGoldbox() {
    const accessKey = process.env.COUPANG_ACCESS_KEY;
    const secretKey = process.env.COUPANG_SECRET_KEY;
    if (!accessKey || !secretKey) return null;

    try {
        const method = 'GET';
        const url = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/goldbox';
        const now = new Date();
        const datetimeStr = `${String(now.getUTCFullYear()).slice(-2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;

        const message = datetimeStr + method + url;
        const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
        const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetimeStr}, signature=${signature}`;

        const res = await fetch(`https://api-gateway.coupang.com${url}`, {
            method: 'GET',
            headers: { 'Authorization': authorization, 'Content-Type': 'application/json' },
            next: { revalidate: 3600 } 
        });
        
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            return data.data.sort((a: any, b: any) => b.discountRate - a.discountRate).slice(0, 2);
        }
    } catch(e) { console.error("쿠팡 API 에러:", e); }
    return null;
}

export default async function ReportPage(props: any) {
    const params = await props.params;
    const ticker = params?.ticker;

    if (!ticker) notFound(); 

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 🚨 [500 에러 방어 로직] 최신 글 1개만 안전하게 추출
    const { data, error } = await supabase
        .from("seo_posts")
        .select("*")
        .eq("ticker", ticker.toUpperCase())
        .order("created_at", { ascending: false })
        .limit(1);
        
    const post = data?.[0];
    const coupangItems = await getCoupangGoldbox();

    if (error || !post) return notFound();

    return (
        <main className="max-w-3xl mx-auto p-6 bg-white text-gray-900 font-sans leading-relaxed">
            <header className="mb-10 border-b border-gray-200 pb-6 mt-8">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-gray-900 leading-snug">
                    {post.title}
                </h1>
                <p className="text-gray-500 text-sm font-medium">
                    업데이트: {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </p>
            </header>

            <article 
                className="[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:border-l-4 [&>h2]:border-blue-600 [&>h2]:pl-3
                           [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                           [&>p]:text-lg [&>p]:mb-6 [&>p]:text-gray-700 [&>p]:leading-loose
                           [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6"
                dangerouslySetInnerHTML={{ __html: post.content_html }}
            />

            {/* 🚨 [쿠팡 방어막] 원가 데이터가 없어도 에러가 나지 않는 구조 */}
            {coupangItems && coupangItems.length > 0 && (
                <div className="mt-16 p-8 bg-zinc-900 rounded-2xl text-left shadow-2xl">
                    <h3 className="text-xl font-extrabold text-white mb-6">🔥 오늘의 골드박스 핫딜</h3>
                    <div className="flex flex-col gap-4">
                        {coupangItems.map((item: any, idx: number) => (
                            <a key={idx} href={item.productUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-4 rounded-xl flex items-center gap-4 group">
                                <img src={item.productImage} alt={item.productName} className="w-20 h-20 object-cover rounded-lg" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{item.productName}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {item.discountRate > 0 && <span className="text-red-500 font-black">{item.discountRate}% ↓</span>}
                                        {item.originalPrice && <span className="text-zinc-400 line-through text-sm">{item.originalPrice.toLocaleString()}원</span>}
                                    </div>
                                    <p className="text-white font-black text-xl mt-1">{item.productPrice ? item.productPrice.toLocaleString() : 0}원</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
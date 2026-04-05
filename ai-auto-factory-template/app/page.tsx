import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export const revalidate = 3600;

export default async function HomePage() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: posts } = await supabase
        .from("seo_posts")
        .select("ticker, title, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            <header className="bg-white border-b border-gray-200 py-16 px-6 text-center shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mb-4">
                        Premium AI Quant Report
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        글로벌 VVIP 마켓 인사이트
                    </h1>
                    <p className="text-lg text-gray-600 font-medium leading-relaxed mb-6">
                        AI 애널리스트가 실시간으로 분석하는 글로벌 심층 리포트입니다.
                    </p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">🔥 최신 분석 리포트</h2>
                
                {/* 🚨 [애드센스 방어막] 글이 0개일 때 빈 화면이 되지 않도록 샘플 출력 */}
                {(!posts || posts.length === 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 opacity-70">
                            <span className="inline-block bg-zinc-100 text-zinc-700 text-xs font-bold px-3 py-1 rounded-md mb-4">SYSTEM</span>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                [안내] AI 애널리스트가 글로벌 마켓 데이터를 수집 중입니다.
                            </h3>
                            <p className="text-sm text-gray-500">잠시 후 고품질 퀀트 리포트가 업데이트됩니다.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <Link href={`/report/${post.ticker}`} key={post.ticker}>
                                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 h-full flex flex-col justify-between cursor-pointer">
                                    <div>
                                        <span className="inline-block bg-zinc-100 text-zinc-700 text-xs font-bold px-3 py-1 rounded-md mb-4">{post.ticker}</span>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-3 leading-snug">{post.title}</h3>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-400 font-medium">
                                        <span>AI 애널리스트</span>
                                        <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
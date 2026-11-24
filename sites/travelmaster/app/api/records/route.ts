import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const kinds = new Set(["trip", "activity", "expense", "booking"]);
async function identity() { return await getChatGPTUser(); }
export async function GET() {
  if (!await identity()) return NextResponse.json({error:"请先登录"}, {status:401});
  try {
    const result = await env.DB!.prepare("SELECT id, kind, data, updated_at, updated_by FROM records ORDER BY updated_at DESC").all();
    return NextResponse.json(result.results.map((r: any) => ({id:r.id, kind:r.kind, data:JSON.parse(r.data), updatedAt:r.updated_at, updatedBy:r.updated_by})), {headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"读取失败，请稍后重试"}, {status:500}); }
}
export async function POST(request: Request) {
  const user = await identity(); if (!user) return NextResponse.json({error:"请先登录"}, {status:401});
  try {
    const body = await request.json() as any;
    if (!kinds.has(body.kind) || !body.data || typeof body.data !== "object" || Array.isArray(body.data) || JSON.stringify(body.data).length > 12000) return NextResponse.json({error:"数据格式错误"},{status:400});
    const id = typeof body.id === "string" && /^[\w-]{1,80}$/.test(body.id) ? body.id : crypto.randomUUID();
    const now = new Date().toISOString();
    const existing = await env.DB!.prepare("SELECT kind, updated_at FROM records WHERE id = ?").bind(id).first<{kind:string;updated_at:string}>();
    if (existing && (existing.kind !== body.kind || !body.updatedAt || existing.updated_at !== body.updatedAt)) return NextResponse.json({error:"该记录已被其他成员修改，请刷新后重试"},{status:409});
    if (existing) {
      const result = await env.DB!.prepare("UPDATE records SET data=?, updated_at=?, updated_by=? WHERE id=? AND updated_at=?").bind(JSON.stringify(body.data),now,user.userId,id,body.updatedAt).run();
      if (!result.meta.changes) return NextResponse.json({error:"该记录已被其他成员修改，请刷新后重试"},{status:409});
    } else await env.DB!.prepare("INSERT INTO records (id,kind,data,updated_at,updated_by) VALUES (?,?,?,?,?)").bind(id,body.kind,JSON.stringify(body.data),now,user.userId).run();
    return NextResponse.json({id,kind:body.kind,data:body.data,updatedAt:now,updatedBy:user.userId});
  } catch { return NextResponse.json({error:"保存失败，请稍后重试"},{status:500}); }
}
export async function DELETE(request: Request) {
  const user = await identity(); if (!user) return NextResponse.json({error:"请先登录"},{status:401});
  try {
    const {id,updatedAt} = await request.json() as {id:string;updatedAt:string};
    if (!id || !updatedAt) return NextResponse.json({error:"数据格式错误"},{status:400});
    const result = await env.DB!.prepare("DELETE FROM records WHERE id=? AND updated_at=?").bind(id,updatedAt).run();
    if (!result.meta.changes) return NextResponse.json({error:"该记录已被修改或删除，请刷新后重试"},{status:409});
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:"删除失败，请稍后重试"},{status:500}); }
}

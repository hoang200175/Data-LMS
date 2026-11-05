// Gọi Claude để nhận xét bài làm. Dùng chung cho Pages Function và Worker data-lms-ai.
import Anthropic from '@anthropic-ai/sdk';

export const SYSTEM = `Bạn là trợ giảng của khoá "Data 16 tuần" cho nhân viên nghiệp vụ mới học phân tích dữ liệu (pandas, thống kê, dự báo). Học viên gửi bài làm của một ô Python hoặc câu trả lời một tình huống. Nhận xét bằng tiếng Việt, giọng đồng nghiệp tử tế, ngắn gọn (tối đa khoảng 180 chữ), theo đúng 3 mục:
1. Điểm làm đúng (1–2 ý cụ thể).
2. Điểm còn thiếu hoặc sai, gọi đúng tên bẫy nếu có (grain, fan-out, average of averages, Simpson, confounder, regression to the mean, survivorship, leakage, base rate…).
3. Một gợi ý bước tiếp theo.
Với bài code: không viết lời giải hoàn chỉnh; chỉ chỉ ra dòng hoặc ý cần sửa. Nếu có đáp án mẫu, dùng nó để đối chiếu nhưng không chép nguyên văn. Không bịa số liệu không có trong bài. Chỉ dùng văn bản thường, không dùng tiêu đề Markdown.`;

export type Outcome = { status: number; body: { feedback?: string; error?: string; detail?: string } };

export async function callClaude(apiKey: string, model: string, prompt: string): Promise<Outcome> {
  const client = new Anthropic({ apiKey });
  try {
    const msg = await client.beta.messages.create({
      model,
      max_tokens: 2000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });
    if (msg.stop_reason === 'refusal') return { status: 422, body: { error: 'AI không nhận xét được bài này. Hãy thử diễn đạt lại.' } };
    const text = msg.content.flatMap((c) => (c.type === 'text' ? [c.text] : [])).join('\n').trim();
    return { status: 200, body: { feedback: text || 'AI không trả về nhận xét.' } };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { status: 429, body: { error: 'AI đang quá tải, thử lại sau ít phút.' } };
    if (e instanceof Anthropic.AuthenticationError) return { status: 500, body: { error: 'Khoá API trên máy chủ không hợp lệ.' } };
    if (e instanceof Anthropic.APIError) {
      // Thông điệp lỗi của Anthropic không chứa khoá; trả ra để dễ chẩn đoán.
      const d = (e.error as { error?: { type?: string; message?: string } } | undefined)?.error;
      return { status: 502, body: { error: `Lỗi từ AI (${e.status}).`, detail: d ? `${d.type}: ${d.message}` : e.message } };
    }
    return { status: 502, body: { error: 'Không kết nối được tới AI.' } };
  }
}

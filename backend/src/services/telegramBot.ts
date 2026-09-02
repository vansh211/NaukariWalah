import fs from 'fs';
import path from 'path';
import { db } from './store';
import { extractTextFromFile, parseResumeText } from './resumeParser';
import { computeJobMatch } from './matchEngine';

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

class TelegramBotClient {
  private token: string;
  private baseUrl: string;
  private fileBaseUrl: string;
  private offset: number = 0;
  private isPolling: boolean = false;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
    this.fileBaseUrl = `https://api.telegram.org/file/bot${token}`;
  }

  public async getMe(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/getMe`);
    const data = await res.json();
    return data;
  }

  public async sendMessage(chatId: number | string, text: string, options: any = {}): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options.parse_mode || 'Markdown',
          disable_web_page_preview: options.disable_web_page_preview ?? true,
        }),
      });
      return await res.json();
    } catch (e) {
      console.error('Telegram sendMessage error:', e);
    }
  }

  public async downloadFile(fileId: string, destPath: string): Promise<boolean> {
    try {
      const fileInfoRes = await fetch(`${this.baseUrl}/getFile?file_id=${fileId}`);
      const fileInfo = await fileInfoRes.json();
      if (!fileInfo.ok || !fileInfo.result?.file_path) {
        return false;
      }

      const downloadUrl = `${this.fileBaseUrl}/${fileInfo.result.file_path}`;
      const response = await fetch(downloadUrl);
      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
      return true;
    } catch (e) {
      console.error('Telegram downloadFile error:', e);
      return false;
    }
  }

  public startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log('🤖 [Telegram Bot] JobWallah Bot polling started successfully.');
    this.pollUpdates();
  }

  private async pollUpdates() {
    while (this.isPolling) {
      try {
        const res = await fetch(`${this.baseUrl}/getUpdates?offset=${this.offset}&timeout=25`);
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            if (update.message) {
              await this.handleIncomingMessage(update.message);
            }
          }
        }
      } catch (err: any) {
        // Network timeout / retry
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private async handleIncomingMessage(msg: any) {
    const chatId = msg.chat?.id;
    if (!chatId) return;

    const text = msg.text?.trim() || '';
    const doc = msg.document;

    // 1. /start or /help
    if (text.startsWith('/start') || text.startsWith('/help')) {
      const firstName = msg.from?.first_name || 'there';
      const welcome =
        `👋 *Hi ${firstName}, Welcome to JobWallah AI Career Bot!* 🚀\n\n` +
        `I can analyze your resume, calculate your *ATS Resume Score*, and find your *Top Matching Jobs* from 200+ top companies like Google, Microsoft, Amazon, Swiggy, and Razorpay.\n\n` +
        `📌 *How to use:*\n` +
        `1️⃣ *Send your Resume:* Simply attach & send your resume file (*PDF, DOCX, or TXT*) right here in this chat.\n` +
        `2️⃣ *Search Jobs:* Type \`/jobs <skill>\` (e.g., \`/jobs React\` or \`/jobs Remote\`) to search live openings.\n` +
        `3️⃣ *Explore Portal:* Visit [JobWallah Platform](http://localhost:5174)\n\n` +
        `✨ *Upload your resume document now to get your instant ATS breakdown!*`;

      await this.sendMessage(chatId, welcome);
      return;
    }

    // 2. /jobs query
    if (text.startsWith('/jobs')) {
      const query = text.replace(/^\/jobs\s*/, '').trim().toLowerCase();

      let matchingJobs = db.jobs;
      if (query) {
        matchingJobs = db.jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(query) ||
            j.skills.some((s) => s.toLowerCase().includes(query)) ||
            j.location.toLowerCase().includes(query) ||
            j.company.toLowerCase().includes(query)
        );
      }

      if (matchingJobs.length === 0) {
        await this.sendMessage(
          chatId,
          `🔍 No jobs found matching "*${query}*". Try searching for \`/jobs React\`, \`/jobs Node\`, or \`/jobs Remote\`.`
        );
        return;
      }

      const topJobs = matchingJobs.slice(0, 5);
      let response = `💼 *Found ${matchingJobs.length} Jobs${query ? ` for "${query}"` : ''}:*\n\n`;

      topJobs.forEach((job, idx) => {
        response += `*${idx + 1}. ${job.title}*\n`;
        response += `🏢 ${job.company} • 📍 ${job.location}\n`;
        response += `💰 ${job.salaryRange} • 💼 ${job.experienceRequired}\n`;
        response += `🛠 ${job.skills.slice(0, 4).join(', ')}\n`;
        response += `🔗 [Apply on JobWallah](http://localhost:5174)\n\n`;
      });

      if (matchingJobs.length > 5) {
        response += `_...and ${matchingJobs.length - 5} more jobs available on JobWallah._\n\n`;
      }
      response += `🌐 Browse all jobs: http://localhost:5174`;

      await this.sendMessage(chatId, response);
      return;
    }

    // 3. Document / Resume Upload
    if (doc) {
      const fileName = doc.file_name || 'resume.pdf';
      const ext = path.extname(fileName).toLowerCase();

      if (!['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
        await this.sendMessage(
          chatId,
          '⚠️ *Unsupported format.* Please send a *PDF*, *DOCX*, or *TXT* resume file.'
        );
        return;
      }

      await this.sendMessage(
        chatId,
        '⏳ *Analyzing your resume with JobWallah AI Engine...*\n_Extracting skills, evaluating ATS score & matching with 200+ jobs..._'
      );

      try {
        const tempFilePath = path.join(uploadsDir, `tg_${Date.now()}_${fileName}`);
        const downloaded = await this.downloadFile(doc.file_id, tempFilePath);

        if (!downloaded) {
          await this.sendMessage(chatId, '❌ Could not download resume from Telegram. Please try again.');
          return;
        }

        const extractedText = await extractTextFromFile(tempFilePath, fileName);
        const parsed = parseResumeText(
          extractedText,
          fileName,
          `/uploads/${path.basename(tempFilePath)}`,
          `tg_${msg.from?.id || 'user'}`,
          msg.from ? `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() : undefined,
          undefined
        );

        // Calculate ATS Score
        let atsScore = 50;
        if (parsed.email && !parsed.email.includes('example')) atsScore += 10;
        if (parsed.phone && parsed.phone.length >= 10) atsScore += 10;
        if (parsed.skills.length >= 5) atsScore += 15;
        if (parsed.skills.length >= 8) atsScore += 10;
        if (parsed.experienceYears >= 2) atsScore += 10;
        atsScore = Math.min(96, Math.max(65, atsScore));

        let atsVerdict = 'Exceptional Match 🎯';
        if (atsScore < 80) atsVerdict = 'Strong Fit ✨';
        if (atsScore < 70) atsVerdict = 'Good Potential 📈';

        // Match against 200+ Jobs
        const scoredJobs = db.jobs
          .map((job) => {
            const match = computeJobMatch(job, parsed);
            return { job, match };
          })
          .sort((a, b) => b.match.score - a.match.score);

        const topMatches = scoredJobs.slice(0, 5);

        let report = `📄 *Resume Analysis for ${parsed.fullName}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📊 *ATS Resume Score:* \`${atsScore}/100\` (${atsVerdict})\n`;
        report += `💼 *Designation:* ${parsed.title}\n`;
        report += `⏱ *Experience:* ${parsed.experienceYears}+ Years\n`;
        report += `📧 *Email:* ${parsed.email}\n\n`;

        report += `🛠 *Extracted Skills (${parsed.skills.length}):*\n`;
        report += `\`${parsed.skills.join(' • ')}\`\n\n`;

        const popularSkills = ['AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Next.js', 'System Design'];
        const missing = popularSkills
          .filter((s) => !parsed.skills.some((ps) => ps.toLowerCase() === s.toLowerCase()))
          .slice(0, 3);

        if (missing.length > 0) {
          report += `💡 *Skill Boost Advice:*\n`;
          report += `Add \`${missing.join(', ')}\` to your resume to increase interview shortlists to *98%+*.\n\n`;
        }

        report += `━━━━━━━━━━━━━━━━━━━━\n`;
        report += `🎯 *Top 5 Matching Jobs for You:*\n\n`;

        topMatches.forEach((item, index) => {
          const j = item.job;
          report += `*${index + 1}. ${j.title}*\n`;
          report += `🏢 *${j.company}* • 📍 ${j.location}\n`;
          report += `💰 ${j.salaryRange} • 💼 ${j.experienceRequired}\n`;
          report += `🔥 *Match Score: ${item.match.score}%* (Matched: _${item.match.matchedSkills.slice(0, 3).join(', ')}_)\n`;
          report += `🔗 [Apply on JobWallah](http://localhost:5174)\n\n`;
        });

        report += `━━━━━━━━━━━━━━━━━━━━\n`;
        report += `🌐 *View all 200+ Jobs & Apply:* [JobWallah Portal](http://localhost:5174)`;

        await this.sendMessage(chatId, report);
      } catch (err: any) {
        console.error('Telegram parse error:', err);
        await this.sendMessage(chatId, `❌ Error analyzing resume: ${err.message || 'Please try uploading a valid PDF/DOCX file.'}`);
      }
      return;
    }

    // 4. Fallback message
    if (text.length > 0) {
      await this.sendMessage(
        chatId,
        `🤖 *Tip:* Attach & send your *Resume file (PDF/DOCX)* to get your instant ATS score & job recommendations, or type \`/jobs ${text}\` to search for openings!`
      );
    }
  }
}

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.log('ℹ️  [Telegram Bot] TELEGRAM_BOT_TOKEN not configured in backend/.env. (Bot is in standby mode)');
    return null;
  }

  const client = new TelegramBotClient(token);
  client
    .getMe()
    .then((res) => {
      if (res.ok) {
        console.log(`🤖 [Telegram Bot] Connected successfully as @${res.result.username}`);
        client.startPolling();
      } else {
        console.warn('⚠️ [Telegram Bot] Invalid TELEGRAM_BOT_TOKEN provided:', res.description);
      }
    })
    .catch((err) => {
      console.warn('⚠️ [Telegram Bot] Connection error:', err.message);
    });

  return client;
}

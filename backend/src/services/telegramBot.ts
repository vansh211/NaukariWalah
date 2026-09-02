import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TelegramBot = require('node-telegram-bot-api');
import { db } from './store';
import { extractTextFromFile, parseResumeText } from './resumeParser';
import { computeJobMatch } from './matchEngine';

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    console.log('ℹ️  [Telegram Bot] TELEGRAM_BOT_TOKEN not configured in backend/.env. (Bot is in standby mode)');
    return null;
  }

  try {
    const bot = new TelegramBot(token, { polling: true });
    console.log('🤖 [Telegram Bot] JobWallah Bot connected and polling for messages...');

    // /start and /help command
    bot.onText(/\/start|\/help/, (msg: any) => {
      const chatId = msg.chat.id;
      const firstName = msg.from?.first_name || 'there';

      const welcomeText =
        `👋 *Hi ${firstName}, Welcome to JobWallah AI Career Assistant!* 🚀\n\n` +
        `I can analyze your resume, calculate your *ATS Resume Score*, and find your *Top Matching Jobs* from 200+ top companies like Google, Microsoft, Amazon, Swiggy, and Razorpay.\n\n` +
        `📌 *How to use:*\n` +
        `1️⃣ *Send your Resume:* Simply attach & send your resume file (*PDF, DOCX, or TXT*) right here in this chat.\n` +
        `2️⃣ *Search Jobs:* Type \`/jobs <skill>\` (e.g., \`/jobs React\` or \`/jobs Remote\`) to search live openings.\n` +
        `3️⃣ *Explore Portal:* Visit [JobWallah Platform](http://localhost:5174)\n\n` +
        `✨ *Upload your resume document now to get your instant ATS breakdown!*`;

      bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown', disable_web_page_preview: true });
    });

    // /jobs command
    bot.onText(/\/jobs(?:\s+(.+))?/, (msg: any, match: any) => {
      const chatId = msg.chat.id;
      const query = (match && match[1]) ? match[1].trim().toLowerCase() : '';

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
        bot.sendMessage(
          chatId,
          `🔍 No jobs found matching "*${query}*". Try searching for \`React\`, \`Node\`, \`Remote\`, or \`Full Stack\`.`,
          { parse_mode: 'Markdown' }
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

      bot.sendMessage(chatId, response, { parse_mode: 'Markdown', disable_web_page_preview: true });
    });

    // Document / Resume Upload Handler
    bot.on('document', async (msg: any) => {
      const chatId = msg.chat.id;
      const doc = msg.document;

      if (!doc) return;

      const fileName = doc.file_name || 'resume.pdf';
      const ext = path.extname(fileName).toLowerCase();

      if (!['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
        bot.sendMessage(
          chatId,
          '⚠️ *Unsupported file format.* Please send a *PDF*, *DOCX*, or *TXT* resume file.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      const processingMsg = await bot.sendMessage(
        chatId,
        '⏳ *Analyzing your resume with JobWallah AI Engine...*\n_Extracting skills, evaluating ATS score & matching with 200+ jobs..._',
        { parse_mode: 'Markdown' }
      );

      try {
        // Download file from Telegram servers
        const fileStream = bot.getFileStream(doc.file_id);
        const tempFilePath = path.join(uploadsDir, `tg_${Date.now()}_${fileName}`);
        const writeStream = fs.createWriteStream(tempFilePath);

        fileStream.pipe(writeStream);

        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', () => resolve());
          writeStream.on('error', (err) => reject(err));
        });

        // Parse resume
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

        // Match against 200+ Database Jobs
        const scoredJobs = db.jobs
          .map((job) => {
            const match = computeJobMatch(job, parsed);
            return { job, match };
          })
          .sort((a, b) => b.match.score - a.match.score);

        const topMatches = scoredJobs.slice(0, 5);

        // Delete processing message
        try {
          await bot.deleteMessage(chatId, processingMsg.message_id);
        } catch {
          // ignore
        }

        // Format Report
        let report = `📄 *Resume Analysis for ${parsed.fullName}*\n`;
        report += `━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📊 *ATS Resume Score:* \`${atsScore}/100\` (${atsVerdict})\n`;
        report += `💼 *Designation:* ${parsed.title}\n`;
        report += `⏱ *Experience:* ${parsed.experienceYears}+ Years\n`;
        report += `📧 *Email:* ${parsed.email}\n\n`;

        report += `🛠 *Extracted Skills (${parsed.skills.length}):*\n`;
        report += `\`${parsed.skills.join(' • ')}\`\n\n`;

        // Missing recommendations
        const popularSkills = ['AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Next.js', 'System Design'];
        const missing = popularSkills.filter((s) => !parsed.skills.some((ps) => ps.toLowerCase() === s.toLowerCase())).slice(0, 3);
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

        bot.sendMessage(chatId, report, { parse_mode: 'Markdown', disable_web_page_preview: true });
      } catch (err: any) {
        console.error('Telegram bot parse error:', err);
        bot.sendMessage(chatId, `❌ *Error analyzing resume:* ${err.message || 'Please try uploading a valid PDF/DOCX file.'}`, {
          parse_mode: 'Markdown',
        });
      }
    });

    // Handle plain text queries
    bot.on('message', (msg: any) => {
      if (msg.document || msg.text?.startsWith('/')) return;
      const chatId = msg.chat.id;
      const text = msg.text?.trim() || '';

      if (text.length > 0) {
        bot.sendMessage(
          chatId,
          `🤖 *Tip:* Send your *Resume file (PDF/DOCX)* to get your instant ATS score & job recommendations, or type \`/jobs ${text}\` to search for jobs!`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    return bot;
  } catch (e) {
    console.warn('Failed to start Telegram Bot:', e);
    return null;
  }
}

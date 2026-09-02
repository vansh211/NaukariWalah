import React, { useState, useEffect, useRef } from 'react';
import { ResumeData } from '../types';
import { api } from '../services/api';
import {
  UploadCloud,
  FileText,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Save,
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface ResumeStudioProps {
  onSuccessToast?: (msg: string) => void;
}

export const ResumeStudio: React.FC<ResumeStudioProps> = ({ onSuccessToast }) => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    try {
      const res = await api.getMyResume();
      if (res.resume) {
        setResume(res.resume);
      }
    } catch (err) {
      console.error('Failed to load resume', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resumeFile', file);

    setUploading(true);
    try {
      const res = await api.uploadResume(formData);
      setResume(res.resume);
      if (onSuccessToast) onSuccessToast('Resume uploaded and profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to parse resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (newSkillInput.trim() && resume) {
      if (!resume.skills.includes(newSkillInput.trim())) {
        const updated = { ...resume, skills: [...resume.skills, newSkillInput.trim()] };
        setResume(updated);
      }
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!resume) return;
    setResume({
      ...resume,
      skills: resume.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleSaveProfile = async () => {
    if (!resume) return;
    setSaving(true);
    try {
      await api.updateResume(resume);
      if (onSuccessToast) onSuccessToast('Profile changes saved successfully!');
    } catch (err: any) {
      alert('Failed to save resume: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${resume?.fullName || 'Candidate'}_Resume.pdf`);
      if (onSuccessToast) onSuccessToast('Resume PDF downloaded!');
    } catch (err) {
      alert('Error generating PDF: ' + err);
    }
  };

  // DOCX Export
  const handleExportDOCX = async () => {
    if (!resume) return;
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: resume.fullName,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `${resume.email} | ${resume.phone} | ${resume.location}`,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: resume.title,
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: '' }),
              new Paragraph({
                text: 'SUMMARY',
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({ text: resume.summary }),
              new Paragraph({ text: '' }),
              new Paragraph({
                text: 'KEY SKILLS',
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({ text: resume.skills.join(' • ') }),
              new Paragraph({ text: '' }),
              new Paragraph({
                text: 'EMPLOYMENT DETAILS',
                heading: HeadingLevel.HEADING_3,
              }),
              ...(resume.experience || []).flatMap((exp) => [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${exp.role} - ${exp.company}`, bold: true }),
                    new TextRun({ text: ` (${exp.duration})`, italics: true }),
                  ],
                }),
                new Paragraph({ text: exp.description }),
                new Paragraph({ text: '' }),
              ]),
              new Paragraph({
                text: 'EDUCATION',
                heading: HeadingLevel.HEADING_3,
              }),
              ...(resume.education || []).map(
                (edu) => new Paragraph({ text: `${edu.degree}, ${edu.institution} (${edu.year})` })
              ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.fullName || 'Candidate'}_Resume.docx`;
      a.click();
      URL.revokeObjectURL(url);
      if (onSuccessToast) onSuccessToast('Resume DOCX downloaded!');
    } catch (err) {
      alert('Error generating DOCX: ' + err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Telegram Bot Tip Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#eef3ff] to-[#f4fbf7] dark:from-[#131d2e] dark:to-[#0f2e1f] border border-[#d0dcf5] dark:border-[#203a58] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🤖</span>
          <div>
            <span className="font-bold text-[#121224] dark:text-white">JobWallah Telegram Bot Assistant: </span>
            <span className="text-[#474d6a] dark:text-slate-300">Send your Resume document (PDF/DOCX) on Telegram to get your instant ATS Score & Top 5 Matching Jobs!</span>
          </div>
        </div>
        <a
          href="https://t.me/JobWallahAssistant_bot"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-1.5 rounded-full font-bold text-white bg-[#0088cc] hover:bg-[#0077b5] transition shrink-0 flex items-center gap-1.5 shadow-xs"
        >
          <span>Open @JobWallahAssistant_bot</span>
          <span>↗</span>
        </a>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#121224] dark:text-white">Profile & Resume Details</h1>
          <p className="text-xs text-[#717b9e] mt-1">
            Keep your resume updated so recruiters can discover your profile.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#275df5] hover:bg-[#1e4bd8] transition shadow-xs flex items-center gap-1.5"
          >
            {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            {uploading ? 'Processing File...' : 'Upload New Resume'}
          </button>

          {resume && (
            <>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#121224] bg-white border border-[#e7e7f0] hover:bg-[#f4f5f7] transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-[#09804c]" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>

              <button
                onClick={handleExportPDF}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#275df5] bg-[#eef3ff] border border-[#d0dcf5] hover:bg-[#e2ebfc] transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>

              <button
                onClick={handleExportDOCX}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#474d6a] bg-[#f4f5f7] border border-[#e7e7f0] hover:bg-[#e9ebef] transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Download DOCX
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Left = Edit Profile, Right = Resume Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Form */}
        <div className="lg:col-span-7 space-y-6">
          {resume ? (
            <div className="naukri-card p-6 bg-white space-y-5">
              <div className="pb-3 border-b border-[#f0f0f5]">
                <h3 className="font-bold text-sm text-[#121224] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#275df5]" />
                  Personal & Contact Information
                </h3>
              </div>

              {/* Personal Info fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#717b9e] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resume.fullName}
                    onChange={(e) => setResume({ ...resume, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#717b9e] mb-1">Current Designation / Role</label>
                  <input
                    type="text"
                    value={resume.title}
                    onChange={(e) => setResume({ ...resume, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#717b9e] mb-1">Email ID</label>
                  <input
                    type="email"
                    value={resume.email}
                    onChange={(e) => setResume({ ...resume, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#717b9e] mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={resume.phone}
                    onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-medium text-[#717b9e] mb-1">Resume Headline / Summary</label>
                <textarea
                  rows={3}
                  value={resume.summary}
                  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-medium text-[#717b9e] mb-1.5">
                  Key Skills ({resume.skills.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Type skill name & click Add (e.g. Next.js, Redis)"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(e)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
                  />
                  <button
                    onClick={handleAddSkill}
                    type="button"
                    className="px-4 py-1.5 rounded-lg bg-[#275df5] hover:bg-[#1e4bd8] text-white text-xs font-semibold"
                  >
                    Add Skill
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-[#fafbfd] border border-[#e7e7f0]">
                  {resume.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-[#474d6a] border border-[#e7e7f0] flex items-center gap-1.5"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#939bb4] hover:text-[#e11d48]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-medium text-[#717b9e] mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#275df5]" />
                  Employment History
                </label>
                <div className="space-y-3">
                  {(resume.experience || []).map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.role}
                          placeholder="Designation"
                          onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].role = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }}
                          className="px-2.5 py-1.5 rounded bg-white border border-[#e7e7f0] text-[#121224]"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          placeholder="Company Name"
                          onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].company = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }}
                          className="px-2.5 py-1.5 rounded bg-white border border-[#e7e7f0] text-[#121224]"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={exp.description}
                        placeholder="Key responsibilities and achievements..."
                        onChange={(e) => {
                          const newExp = [...resume.experience];
                          newExp[idx].description = e.target.value;
                          setResume({ ...resume, experience: newExp });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-[#e7e7f0] text-[#121224]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="naukri-card p-12 text-center bg-white border-dashed">
              <UploadCloud className="w-12 h-12 text-[#275df5] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#121224]">Upload Your Resume</h3>
              <p className="text-xs text-[#717b9e] mt-1 max-w-sm mx-auto mb-4">
                Supported Formats: doc, docx, pdf, txt up to 10MB
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full font-bold text-white bg-[#275df5] hover:bg-[#1e4bd8] text-xs shadow-xs"
              >
                Upload Resume
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Clean Resume Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#717b9e]">Standard Resume Format</span>
          </div>

          <div
            ref={previewRef}
            className="rounded-2xl p-6 bg-white border border-[#e7e7f0] shadow-xs text-xs space-y-5"
          >
            {resume ? (
              <>
                <div className="pb-3 border-b border-[#f0f0f5]">
                  <h2 className="text-xl font-bold text-[#121224]">{resume.fullName}</h2>
                  <p className="text-xs font-semibold text-[#275df5] mt-0.5">{resume.title}</p>
                  <p className="text-[11px] text-[#717b9e] mt-1">
                    {resume.email} • {resume.phone} • {resume.location}
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-[#121224] uppercase tracking-wider mb-1">
                    Profile Summary
                  </h4>
                  <p className="text-xs text-[#474d6a] leading-relaxed">{resume.summary}</p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-[#121224] uppercase tracking-wider mb-1.5">
                    Key Skills
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {resume.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[11px] bg-[#f4f5f7] text-[#474d6a]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-[#121224] uppercase tracking-wider mb-2">
                    Employment
                  </h4>
                  <div className="space-y-2">
                    {(resume.experience || []).map((exp, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between font-semibold text-[#121224]">
                          <span>{exp.role} — {exp.company}</span>
                          <span className="text-[11px] text-[#939bb4]">{exp.duration}</span>
                        </div>
                        <p className="text-[#717b9e] text-[11px] mt-0.5">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-[#121224] uppercase tracking-wider mb-1">
                    Education
                  </h4>
                  {(resume.education || []).map((edu, idx) => (
                    <div key={idx} className="flex justify-between text-[#474d6a]">
                      <span>{edu.degree}, {edu.institution}</span>
                      <span className="text-[#939bb4]">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-[#939bb4]">Resume preview will show here</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useState } from 'react';

const MAX_MB = 8;

export default function ApplyForm() {
  const [status, setStatus] = useState('idle'); // idle | sending | ok | error
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.target;
    const resumeFile = form.resume.files?.[0];

    if (resumeFile && resumeFile.size > MAX_MB * 1024 * 1024) {
      setStatus('error');
      setErrorMsg(`Resume file is too large — please keep it under ${MAX_MB}MB.`);
      return;
    }

    const formData = new FormData(form);

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('ok');
      form.reset();
      setFileName('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  if (status === 'ok') {
    return (
      <p className="form-status ok" style={{ fontSize: 15 }}>
        Thanks for applying — we've received your information and will be in touch if there's a
        fit.
      </p>
    );
  }

  return (
    <form className="contact-form" style={{ maxWidth: 560 }} onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" required />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" />
      </div>
      <div>
        <label htmlFor="position">Position you're interested in</label>
        <input id="position" name="position" type="text" placeholder="e.g. Field Technician, Party Chief, Office/CAD" />
      </div>
      <div>
        <label htmlFor="message">Tell us about your experience</label>
        <textarea id="message" name="message" />
      </div>
      <div>
        <label htmlFor="resume">Resume / CV (PDF or Word, {MAX_MB}MB max)</label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
        />
        {fileName && (
          <p className="form-status ok" style={{ marginTop: 6 }}>Selected: {fileName}</p>
        )}
      </div>
      <button type="submit" className="btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'SUBMITTING…' : 'SUBMIT APPLICATION →'}
      </button>
      {status === 'error' && <p className="form-status err">{errorMsg}</p>}
    </form>
  );
}

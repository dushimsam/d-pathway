/** Minimal, inline-styled email bodies. Kept dependency-free and brand-blue. */

const BRAND = '#2847d3';

function shell(heading: string, body: string): string {
  return `
  <div style="margin:0;padding:24px;background:#f5f7ff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7eaf4;">
      <div style="background:${BRAND};padding:20px 24px;">
        <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">D·Pathway</span>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#0b1020;">${heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#3a4056;">${body}</div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #eef0f6;color:#9aa0b4;font-size:12px;">
        You're receiving this because you have a D·Pathway account.
      </div>
    </div>
  </div>`;
}

export const emailTemplates = {
  applicationAccepted(projectTitle: string, companyName: string) {
    return {
      subject: `You're in — ${projectTitle}`,
      html: shell(
        'Your application was accepted 🎉',
        `<p><strong>${companyName}</strong> selected you for <strong>${projectTitle}</strong>.</p>
         <p>Head to your applications to submit your deliverable before the deadline.</p>`,
      ),
    };
  },
  applicationDeclined(
    projectTitle: string,
    companyName: string,
    reason?: string | null,
  ) {
    return {
      subject: `Update on your application — ${projectTitle}`,
      html: shell(
        'An update on your application',
        `<p><strong>${companyName}</strong> won't be moving forward with your application for <strong>${projectTitle}</strong> this time.</p>
         ${reason ? `<p style="color:#5c6276;"><em>“${reason}”</em></p>` : ''}
         <p>Keep going — there are more briefs waiting in the catalogue.</p>`,
      ),
    };
  },
  deliverableSubmitted(projectTitle: string, graduateName: string) {
    return {
      subject: `New submission — ${projectTitle}`,
      html: shell(
        'A deliverable is ready to review',
        `<p><strong>${graduateName}</strong> submitted work for <strong>${projectTitle}</strong>.</p>
         <p>Open your dashboard to evaluate it.</p>`,
      ),
    };
  },
  evaluationRecorded(projectTitle: string, score: number, outcome: string) {
    const nice = outcome.replace(/_/g, ' ').toLowerCase();
    return {
      subject: `Your work was reviewed — ${projectTitle}`,
      html: shell(
        'Your submission was evaluated',
        `<p>Your work for <strong>${projectTitle}</strong> scored <strong>${score}/5</strong>.</p>
         <p>Outcome: <strong>${nice}</strong>.</p>`,
      ),
    };
  },
  prizeAwarded(
    projectTitle: string,
    companyName: string,
    amount: number,
    currency: string,
  ) {
    const money = `${currency.toUpperCase()} ${amount.toLocaleString('en-US')}`;
    return {
      subject: `You won the prize — ${projectTitle} 🏆`,
      html: shell(
        `You've been awarded ${money}`,
        `<p><strong>${companyName}</strong> marked you as the winner of <strong>${projectTitle}</strong>.</p>
         <p><strong>${money}</strong> has been added to your D·Pathway balance — you can cash it out from your earnings page.</p>`,
      ),
    };
  },
};

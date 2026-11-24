import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type FooterPanel = 'privacy' | 'terms' | 'support';

const panelContent: Record<FooterPanel, { title: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Information used by QueueLess',
        body: 'QueueLess uses account details you provide, such as your name, email address, and phone number, together with the institution, service, and visit details needed to manage your queue experience.',
      },
      {
        heading: 'Digital passes and arrival slots',
        body: 'A QR pass identifies a queue booking so an authorized facility can check you in. Keep it private and show it only to facility staff. Arrival slots and wait estimates help plan your visit; they are estimates and may change as service conditions change.',
      },
      {
        heading: 'How information is used and shared',
        body: 'Information is used to create and manage bookings, provide queue updates, support check-in, and operate the service. Relevant booking details may be visible to the institution handling your visit and to service providers that help operate QueueLess. QueueLess does not sell personal information.',
      },
      {
        heading: 'Protection and retention',
        body: 'Reasonable technical and organizational safeguards are used to protect information. No online service can guarantee absolute security. Booking information is retained only as needed for service operations and applicable institutional requirements.',
      },
      {
        heading: 'Your choices',
        body: 'You may update account information through the available account features. For questions about access, correction, or deletion of visit information, contact the institution associated with your booking.',
      },
      {
        heading: 'Demo notice',
        body: 'This policy is provided for the QueueLess demonstration and describes intended platform practices. A production deployment should publish institution-specific details and a verified privacy contact.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        heading: 'Using QueueLess',
        body: 'QueueLess helps visitors request and manage digital queue tokens and helps institutions coordinate service. Use accurate information and use the service only for legitimate visits.',
      },
      {
        heading: 'Bookings, QR passes, and arrival times',
        body: 'A booking or QR pass is for the visitor and service shown in the app. Do not copy, share, alter, or use another person’s pass. Follow the arrival instructions from the institution. Arrival slots, queue positions, and wait times are estimates, not a guarantee of service at a particular time.',
      },
      {
        heading: 'Facility instructions',
        body: 'The institution providing the service controls its hours, eligibility requirements, check-in process, and service decisions. Follow staff instructions and applicable facility policies. A digital token does not replace required identification or other documents.',
      },
      {
        heading: 'Acceptable use',
        body: 'Do not misuse the service, disrupt queue operations, attempt unauthorized access, or submit information you are not authorized to use. Access may be limited when needed to protect visitors, institutions, or the service.',
      },
      {
        heading: 'Service availability',
        body: 'QueueLess is provided as an operational aid and may be changed or temporarily unavailable. If the app is unavailable or information appears inconsistent, contact facility staff for assistance.',
      },
      {
        heading: 'Demo notice',
        body: 'These terms are a demonstration template, not legal advice. Production use requires review and terms specific to the operating institution and jurisdiction.',
      },
    ],
  },
  support: {
    title: 'Support',
    sections: [
      {
        heading: 'Need help with a visit?',
        body: 'For questions about an appointment, service eligibility, check-in, or a queue token, contact the institution or facility where you booked. Facility staff can verify your booking and help with your QR pass.',
      },
      {
        heading: 'Using QueueLess',
        body: 'Keep your QR pass available for check-in, arrive within the suggested arrival window, and check the app for queue updates. Estimated wait times can change as the facility serves visitors.',
      },
      {
        heading: 'Institution administrators',
        body: 'For access to an institution admin account or help configuring a facility, contact your institution’s QueueLess administrator.',
      },
    ],
  },
};

export const Footer: React.FC = () => {
  const [activePanel, setActivePanel] = useState<FooterPanel | null>(null);
  const content = activePanel ? panelContent[activePanel] : null;

  useEffect(() => {
    if (!activePanel) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePanel(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel]);

  return (
    <>
      <footer className="min-h-[64px] border-t border-navy-700 bg-navy-900 px-4 py-3 text-slate-300 sm:px-6 lg:px-8 max-sm:min-h-[88px]">
        <div className="mx-auto flex min-h-[38px] max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[11px] font-bold text-navy">
                Q
              </span>
              <span className="text-xs font-semibold text-white">QueueLess</span>
              <span className="text-[10px] text-slate-300 sm:text-[11px]">
                Smart Queue &amp; Crowd Management
              </span>
            </div>
            <span className="text-[10px] text-slate-300">
              © 2026 QueueLess. All rights reserved.
            </span>
          </div>

          <nav aria-label="Footer links" className="flex items-center gap-4 text-[11px] text-slate-200 sm:gap-5">
            <button
              type="button"
              onClick={() => setActivePanel('privacy')}
              className="rounded-sm transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('terms')}
              className="rounded-sm transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('support')}
              className="rounded-sm transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Support
            </button>
          </nav>
        </div>
      </footer>

      {content && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActivePanel(null);
          }}
        >
          <section
            aria-labelledby="footer-dialog-title"
            aria-modal="true"
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-borderSoft bg-[#F9F8F3] shadow-elevated"
            role="dialog"
          >
            <header className="flex items-center justify-between border-b border-borderSoft px-5 py-4 sm:px-7">
              <h2 id="footer-dialog-title" className="text-lg font-semibold text-navy">
                {content.title}
              </h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setActivePanel(null)}
                className="rounded-lg p-2 text-textMuted transition-colors hover:bg-slate-100 hover:text-textMain focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-5 sm:px-7">
              <p className="mb-5 text-xs leading-relaxed text-textMuted">
                QueueLess helps visitors and service institutions coordinate digital queues and visits.
              </p>
              <div className="space-y-5">
                {content.sections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="mb-1 text-sm font-semibold text-textMain">{section.heading}</h3>
                    <p className="text-xs leading-relaxed text-textMuted">{section.body}</p>
                  </section>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

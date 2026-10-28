import { ChevronRight } from "lucide-react";
import { PageHeader } from "./primitives";
import "./HelpPage.css";

const FAQ_ITEMS = [
    {
        id: "saving",
        question: "Do I need to save my changes manually?",
        answer: (
            <>
                Project plan changes save automatically in this browser.
                The indicator at the top right shows <strong>Saving…</strong> while
                a save is in progress and <strong>Saved locally</strong> when it
                has completed. Submit any open form to apply its changes.
            </>
        ),
    },
    {
        id: "project",
        question: "Why do I need to open a project first?",
        answer: (
            <>
                Chapters, characters, locations, events and timelines belong
                to a project. Open the story you want from <strong>Projects</strong>,
                then return to the relevant page.
            </>
        ),
    },
    {
        id: "backup",
        question: "How do I back up or move my projects?",
        answer: (
            <>
                Open <strong>Backup &amp; Restore</strong> and choose{" "}
                <strong>Download backup</strong>. To move your work, open the app
                in the other browser or computer and restore that{" "}
                <strong>.json</strong> backup. Review the restore options before
                confirming. <strong>Export</strong> downloads an Excel planning
                sheet; use the JSON backup when you need to restore your work.
            </>
        ),
    },
    {
        id: "failure",
        question: "What should I do if saving fails?",
        answer: (
            <>
                Choose <strong>Retry</strong> in the save error banner.
                If the problem continues, use <strong>Export backup</strong> in
                the same banner to keep a separate copy before leaving the page.
            </>
        ),
    },
    {
        id: "timeline",
        question: "Why is my timeline empty?",
        answer: (
            <>
                Check that the correct project is open. In <strong>Events</strong>,
                add an event or scene, fill in its date information and save it.
                Return to <strong>Timeline</strong> to see the recorded story
                chronology.
            </>
        ),
    },
];

export function HelpPage() {
    return (
        <div className="page-stack core-page help-page">
            <PageHeader title="Help" />

            <section
                className="help-faq"
                aria-labelledby="help-faq-heading"
            >
                <h2 id="help-faq-heading">Frequently asked questions</h2>

                <div className="help-faq-list">
                    {FAQ_ITEMS.map((item) => (
                        <details className="help-faq-item" key={item.id}>
                            <summary>
                                <span>{item.question}</span>
                                <ChevronRight size={16} aria-hidden="true" />
                            </summary>

                            <p>{item.answer}</p>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}